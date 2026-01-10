import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/groups/[id] - Get single group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSessionUser()

    // Try to find by slug first, then by id
    const group = await prisma.group.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' }, // owner first, then admin, etc.
            { joinedAt: 'asc' },
          ],
          take: 10,
        },
        _count: {
          select: { members: true, posts: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user can view this group
    if (group.privacy === 'secret') {
      if (!user) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }
    }

    // Get user's membership status
    let userMembership = null
    if (user) {
      userMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
        select: { role: true, joinedAt: true },
      })
    }

    // Get pending join request if any
    let pendingRequest = null
    if (user && !userMembership) {
      pendingRequest = await prisma.groupJoinRequest.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
        select: { status: true, createdAt: true },
      })
    }

    return NextResponse.json({
      group: {
        ...group,
        isMember: !!userMembership,
        userRole: userMembership?.role || null,
        pendingRequest: pendingRequest?.status === 'pending' ? pendingRequest : null,
      },
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

// PATCH /api/groups/[id] - Update group
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is owner or admin
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Not authorized to edit this group' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, privacy, coverImage, avatar, requireApproval, allowMemberPosts } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (category !== undefined) updateData.category = category || null
    if (privacy !== undefined) updateData.privacy = privacy
    if (coverImage !== undefined) updateData.coverImage = coverImage || null
    if (avatar !== undefined) updateData.avatar = avatar || null
    if (requireApproval !== undefined) updateData.requireApproval = requireApproval
    if (allowMemberPosts !== undefined) updateData.allowMemberPosts = allowMemberPosts

    const updatedGroup = await prisma.group.update({
      where: { id: group.id },
      data: updateData,
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    })

    return NextResponse.json({ group: updatedGroup })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

// DELETE /api/groups/[id] - Delete group
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

    // Only owner can delete
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the group owner can delete the group' }, { status: 403 })
    }

    await prisma.group.delete({ where: { id: group.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
