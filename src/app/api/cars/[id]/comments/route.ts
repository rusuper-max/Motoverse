import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { notifyCarOwnerAboutComment } from '@/lib/notifications'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/comments - Get comments for a car (with replies and likes)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params
        const currentUser = await getSessionUser()

        // Fetch top-level comments (no parent) with their replies
        const comments = await prisma.carComment.findMany({
            where: {
                carId,
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
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: currentUser ? {
                    where: { userId: currentUser.id },
                    select: { id: true },
                } : false,
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
                        _count: {
                            select: {
                                likes: true,
                                replies: true,
                            },
                        },
                        likes: currentUser ? {
                            where: { userId: currentUser.id },
                            select: { id: true },
                        } : false,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Transform to add isLiked flag
        const transformedComments = comments.map(comment => {
            const commentLikes = Array.isArray(comment.likes) ? comment.likes : []
            return {
                ...comment,
                isLiked: commentLikes.length > 0,
                likes: undefined,
                replies: comment.replies.map(reply => {
                    const replyLikes = Array.isArray(reply.likes) ? reply.likes : []
                    return {
                        ...reply,
                        isLiked: replyLikes.length > 0,
                        likes: undefined,
                    }
                }),
            }
        })

        return NextResponse.json({ comments: transformedComments })
    } catch (error) {
        console.error('[car-comments.GET] failed', error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/cars/[id]/comments - Add a comment or reply to a car
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId } = await params
        const body = await request.json()
        const { content, parentId } = body

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        // Verify car exists
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { id: true, isPublic: true },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        // If parentId provided, verify it exists and belongs to same car
        if (parentId) {
            const parentComment = await prisma.carComment.findUnique({
                where: { id: parentId },
                select: { carId: true },
            })
            if (!parentComment || parentComment.carId !== carId) {
                return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
            }
        }

        const comment = await prisma.carComment.create({
            data: {
                content: content.trim(),
                carId,
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
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        })

        // Notify car owner about the comment (only for top-level comments)
        if (!parentId) {
            await notifyCarOwnerAboutComment(carId, user.id, content.trim())
        }

        return NextResponse.json({
            comment: {
                ...comment,
                isLiked: false,
                replies: [],
            }
        }, { status: 201 })
    } catch (error) {
        console.error('[car-comments.POST] failed', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
