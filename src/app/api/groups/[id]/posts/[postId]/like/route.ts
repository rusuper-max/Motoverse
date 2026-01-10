import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string; postId: string }>
}

// POST /api/groups/[id]/posts/[postId]/like - Like a post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, postId } = await params
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

    // Check membership for private groups
    if (group.privacy !== 'public') {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Must be a member' }, { status: 403 })
      }
    }

    const post = await prisma.groupPost.findUnique({
      where: { id: postId },
    })

    if (!post || post.groupId !== group.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    })

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    await prisma.groupPostLike.create({
      data: {
        postId,
        userId: user.id,
      },
    })

    const likeCount = await prisma.groupPostLike.count({ where: { postId } })

    return NextResponse.json({ liked: true, likeCount })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/posts/[postId]/like - Unlike a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, postId } = await params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const like = await prisma.groupPostLike.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    })

    if (!like) {
      return NextResponse.json({ error: 'Not liked' }, { status: 400 })
    }

    await prisma.groupPostLike.delete({
      where: { postId_userId: { postId, userId: user.id } },
    })

    const likeCount = await prisma.groupPostLike.count({ where: { postId } })

    return NextResponse.json({ liked: false, likeCount })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 })
  }
}
