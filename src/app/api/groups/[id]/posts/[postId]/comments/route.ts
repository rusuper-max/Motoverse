import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string; postId: string }>
}

// GET /api/groups/[id]/posts/[postId]/comments - Get comments
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, postId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const user = await getSessionUser()

    const group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { id }] },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership for private groups
    if (group.privacy !== 'public') {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Must be a member' }, { status: 403 })
      }
    }

    const [comments, total] = await Promise.all([
      prisma.groupPostComment.findMany({
        where: { postId, parentId: null }, // Top-level comments only
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 3, // Show first 3 replies
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.groupPostComment.count({ where: { postId, parentId: null } }),
    ])

    return NextResponse.json({
      comments,
      total,
      hasMore: offset + comments.length < total,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/groups/[id]/posts/[postId]/comments - Add a comment
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

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Must be a member to comment' }, { status: 403 })
    }

    const post = await prisma.groupPost.findUnique({
      where: { id: postId },
    })

    if (!post || post.groupId !== group.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify parent comment exists if replying
    if (parentId) {
      const parentComment = await prisma.groupPostComment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const comment = await prisma.groupPostComment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
