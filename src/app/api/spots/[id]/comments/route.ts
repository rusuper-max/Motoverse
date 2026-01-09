import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/spots/[id]/comments - Get comments for a spot
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const spot = await prisma.carSpot.findUnique({
      where: { id },
    })

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // Get top-level comments with replies
    const comments = await prisma.carSpotComment.findMany({
      where: {
        spotId: id,
        parentId: null, // Only top-level comments
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
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/spots/[id]/comments - Add a comment to a spot
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const user = await getSessionUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const spot = await prisma.carSpot.findUnique({
      where: { id },
    })

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, parentId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // If parentId is provided, verify it exists and belongs to this spot
    if (parentId) {
      const parentComment = await prisma.carSpotComment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.spotId !== id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const comment = await prisma.carSpotComment.create({
      data: {
        content: content.trim(),
        spotId: id,
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
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
