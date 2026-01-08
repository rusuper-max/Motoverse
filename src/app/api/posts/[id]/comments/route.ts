import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: postId } = await params
        const comments = await prisma.comment.findMany({
            where: { postId },
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
        })

        return NextResponse.json({ comments })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/posts/[id]/comments - Add a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: postId } = await params
        const body = await request.json()
        const { content } = body

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
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
            },
        })

        return NextResponse.json({ comment }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
