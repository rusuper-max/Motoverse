import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/posts/[id]/comments - Get comments for a post (with replies and likes)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: postId } = await params
        const currentUser = await getSessionUser()

        // Fetch top-level comments (no parent) with their replies
        const comments = await prisma.comment.findMany({
            where: {
                postId,
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
            orderBy: { createdAt: 'asc' },
        })

        // Transform to add isLiked flag
        const transformedComments = comments.map(comment => ({
            ...comment,
            isLiked: currentUser ? comment.likes.length > 0 : false,
            likes: undefined,
            replies: comment.replies.map(reply => ({
                ...reply,
                isLiked: currentUser ? reply.likes.length > 0 : false,
                likes: undefined,
            })),
        }))

        return NextResponse.json({ comments: transformedComments })
    } catch (error) {
        console.error('[comments.GET] failed', error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/posts/[id]/comments - Add a comment or reply
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: postId } = await params
        const body = await request.json()
        const { content, parentId } = body

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        // If parentId provided, verify it exists and belongs to same post
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { postId: true },
            })
            if (!parentComment || parentComment.postId !== postId) {
                return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
            }
        }

        const comment = await prisma.comment.create({
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
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        })

        return NextResponse.json({
            comment: {
                ...comment,
                isLiked: false,
                replies: [],
            }
        }, { status: 201 })
    } catch (error) {
        console.error('[comments.POST] failed', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
