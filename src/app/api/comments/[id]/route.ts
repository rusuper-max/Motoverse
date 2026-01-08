import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/comments/[id] - Edit a comment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: commentId } = await params
        const body = await request.json()
        const { content } = body

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        // Verify ownership
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        if (comment.authorId !== user.id) {
            return NextResponse.json({ error: 'Not authorized to edit this comment' }, { status: 403 })
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
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

        return NextResponse.json({ comment: updatedComment })
    } catch (error) {
        console.error('[comments.PATCH] failed', error)
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: commentId } = await params

        // Verify ownership
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        if (comment.authorId !== user.id) {
            return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
        }

        await prisma.comment.delete({
            where: { id: commentId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[comments.DELETE] failed', error)
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
}
