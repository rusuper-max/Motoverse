import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/groups/[id]/posts - Get group posts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Check if user can view posts
    if (group.privacy !== 'public') {
      if (!user) {
        return NextResponse.json({ error: 'Must be logged in to view this group' }, { status: 401 })
      }
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Must be a member to view posts' }, { status: 403 })
      }
    }

    const [posts, total] = await Promise.all([
      prisma.groupPost.findMany({
        where: { groupId: group.id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          likes: user ? {
            where: { userId: user.id },
            select: { id: true },
          } : false,
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.groupPost.count({ where: { groupId: group.id } }),
    ])

    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      isLiked: user ? (post.likes as any[])?.length > 0 : false,
      likes: undefined,
    }))

    return NextResponse.json({
      posts: postsWithLikeStatus,
      total,
      hasMore: offset + posts.length < total,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/groups/[id]/posts - Create a post in the group
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

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Must be a member to post' }, { status: 403 })
    }

    // Check if members can post
    if (!group.allowMemberPosts && membership.role === 'member') {
      return NextResponse.json({ error: 'Only admins can post in this group' }, { status: 403 })
    }

    const body = await request.json()
    const { content, images, carId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
    }

    const post = await prisma.groupPost.create({
      data: {
        content: content.trim(),
        images: images || [],
        carId: carId || null,
        groupId: group.id,
        authorId: user.id,
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
        _count: {
          select: { comments: true, likes: true },
        },
      },
    })

    // Update post count
    await prisma.group.update({
      where: { id: group.id },
      data: { postCount: { increment: 1 } },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
