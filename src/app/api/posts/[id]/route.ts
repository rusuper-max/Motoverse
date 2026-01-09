import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/posts/[id] - Get a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                car: {
                    select: {
                        id: true,
                        year: true,
                        generation: {
                            select: {
                                model: {
                                    select: {
                                        name: true,
                                        make: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                    },
                },
            },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // Check if current user liked this post
        const user = await getSessionUser()
        let isLiked = false
        if (user) {
            const like = await prisma.like.findFirst({
                where: { postId: id, userId: user.id },
            })
            isLiked = !!like
        }

        return NextResponse.json({ post, isLiked })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { title, content, category, mileage, cost } = body

        const post = await prisma.post.findUnique({ where: { id } })
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

        if (post.authorId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updated = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                ...(category !== undefined && { category }),
                ...(mileage !== undefined && { mileage }),
                ...(cost !== undefined && { cost }),
            },
        })

        return NextResponse.json({ post: updated })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const post = await prisma.post.findUnique({ where: { id } })
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

        if (post.authorId !== user.id) {
            // Check if admin? For now only owner
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.post.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }
}
