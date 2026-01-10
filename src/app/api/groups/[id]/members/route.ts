import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/groups/[id]/members - Get group members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const role = searchParams.get('role')

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const where: any = { groupId: group.id }
    if (role) {
      where.role = role
    }

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              accountType: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.groupMember.count({ where }),
    ])

    return NextResponse.json({
      members,
      total,
      hasMore: offset + members.length < total,
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// PATCH /api/groups/[id]/members - Update member role or handle join requests
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if current user is admin/owner
    const currentMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Handle join request approval/rejection
    if (action === 'approve' || action === 'reject') {
      const joinRequest = await prisma.groupJoinRequest.findUnique({
        where: { groupId_userId: { groupId: group.id, userId } },
      })

      if (!joinRequest || joinRequest.status !== 'pending') {
        return NextResponse.json({ error: 'No pending request found' }, { status: 404 })
      }

      if (action === 'approve') {
        // Create membership and update request
        await prisma.$transaction([
          prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId,
              role: 'member',
            },
          }),
          prisma.groupJoinRequest.update({
            where: { groupId_userId: { groupId: group.id, userId } },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewedById: user.id,
            },
          }),
          prisma.group.update({
            where: { id: group.id },
            data: { memberCount: { increment: 1 } },
          }),
        ])

        return NextResponse.json({ status: 'approved', message: 'Member approved' })
      } else {
        await prisma.groupJoinRequest.update({
          where: { groupId_userId: { groupId: group.id, userId } },
          data: {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedById: user.id,
          },
        })

        return NextResponse.json({ status: 'rejected', message: 'Request rejected' })
      }
    }

    // Handle role change
    if (role) {
      const targetMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId } },
      })

      if (!targetMembership) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }

      // Can't change owner's role unless you're the owner
      if (targetMembership.role === 'owner' && currentMembership.role !== 'owner') {
        return NextResponse.json({ error: 'Cannot modify owner role' }, { status: 403 })
      }

      // Only owner can make someone else owner
      if (role === 'owner' && currentMembership.role !== 'owner') {
        return NextResponse.json({ error: 'Only owner can transfer ownership' }, { status: 403 })
      }

      // If transferring ownership, demote current owner
      if (role === 'owner') {
        await prisma.$transaction([
          prisma.groupMember.update({
            where: { groupId_userId: { groupId: group.id, userId: user.id } },
            data: { role: 'admin' },
          }),
          prisma.groupMember.update({
            where: { groupId_userId: { groupId: group.id, userId } },
            data: { role: 'owner' },
          }),
        ])
      } else {
        await prisma.groupMember.update({
          where: { groupId_userId: { groupId: group.id, userId } },
          data: { role },
        })
      }

      return NextResponse.json({ status: 'updated', message: 'Role updated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/members - Remove a member (kick)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if current user is admin/owner
    const currentMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!currentMembership || !['owner', 'admin', 'moderator'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Not authorized to remove members' }, { status: 403 })
    }

    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't kick owner
    if (targetMembership.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 403 })
    }

    // Admins can only kick members and moderators
    if (currentMembership.role === 'admin' && targetMembership.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot kick other admins' }, { status: 403 })
    }

    // Moderators can only kick members
    if (currentMembership.role === 'moderator' && targetMembership.role !== 'member') {
      return NextResponse.json({ error: 'Moderators can only kick regular members' }, { status: 403 })
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    await prisma.group.update({
      where: { id: group.id },
      data: { memberCount: { decrement: 1 } },
    })

    return NextResponse.json({ status: 'removed', message: 'Member removed' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
