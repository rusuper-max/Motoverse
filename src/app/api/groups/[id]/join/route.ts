import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/groups/[id]/join - Join or request to join a group
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Check if there's a pending request
    const existingRequest = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (existingRequest?.status === 'pending') {
      return NextResponse.json({ error: 'Join request already pending' }, { status: 400 })
    }

    // For private groups, create a join request
    if (group.privacy === 'private') {
      const body = await request.json().catch(() => ({}))

      const joinRequest = await prisma.groupJoinRequest.upsert({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
        create: {
          groupId: group.id,
          userId: user.id,
          message: body.message || null,
          status: 'pending',
        },
        update: {
          status: 'pending',
          message: body.message || null,
          createdAt: new Date(),
        },
      })

      return NextResponse.json({
        status: 'pending',
        message: 'Join request submitted',
        request: joinRequest,
      })
    }

    // For public groups, join immediately
    const membership = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'member',
      },
    })

    // Update member count
    await prisma.group.update({
      where: { id: group.id },
      data: { memberCount: { increment: 1 } },
    })

    return NextResponse.json({
      status: 'joined',
      message: 'Successfully joined the group',
      membership,
    })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/join - Leave a group or cancel join request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if member
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (membership) {
      // Can't leave if you're the owner
      if (membership.role === 'owner') {
        return NextResponse.json({
          error: 'Owner cannot leave the group. Transfer ownership first or delete the group.'
        }, { status: 400 })
      }

      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })

      // Update member count
      await prisma.group.update({
        where: { id: group.id },
        data: { memberCount: { decrement: 1 } },
      })

      return NextResponse.json({ status: 'left', message: 'Successfully left the group' })
    }

    // Check for pending request
    const joinRequest = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (joinRequest && joinRequest.status === 'pending') {
      await prisma.groupJoinRequest.delete({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })

      return NextResponse.json({ status: 'cancelled', message: 'Join request cancelled' })
    }

    return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
  }
}
