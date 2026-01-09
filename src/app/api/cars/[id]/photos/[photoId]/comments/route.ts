import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; photoId: string }>
}

// GET /api/cars/[id]/photos/[photoId]/comments - Get comments for a photo
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { photoId } = await params
        const user = await getSessionUser(request)

        const comments = await prisma.carPhotoComment.findMany({
            where: {
                photoId,
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
                        likes: {
                            select: { userId: true },
                        },
                        _count: {
                            select: { likes: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                likes: {
                    select: { userId: true },
                },
                _count: {
                    select: { likes: true, replies: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Transform comments with isLiked flag
        const commentsWithLikes = comments.map(comment => ({
            ...comment,
            isLiked: user ? comment.likes.some(l => l.userId === user.id) : false,
            likes: undefined,
            replies: comment.replies.map(reply => ({
                ...reply,
                isLiked: user ? reply.likes.some(l => l.userId === user.id) : false,
                likes: undefined,
            })),
        }))

        return NextResponse.json({ comments: commentsWithLikes })
    } catch (error) {
        console.error('[photoComments.GET] failed', error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/cars/[id]/photos/[photoId]/comments - Add a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { photoId } = await params
        const body = await request.json()
        const { content, parentId } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        // Verify photo exists
        const photo = await prisma.carPhoto.findUnique({
            where: { id: photoId },
        })

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        // If replying, verify parent comment exists
        if (parentId) {
            const parentComment = await prisma.carPhotoComment.findUnique({
                where: { id: parentId },
            })
            if (!parentComment || parentComment.photoId !== photoId) {
                return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
            }
        }

        const comment = await prisma.carPhotoComment.create({
            data: {
                content: content.trim(),
                photoId,
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
                _count: {
                    select: { likes: true, replies: true },
                },
            },
        })

        return NextResponse.json({
            comment: {
                ...comment,
                isLiked: false,
                replies: [],
            },
        }, { status: 201 })
    } catch (error) {
        console.error('[photoComments.POST] failed', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
