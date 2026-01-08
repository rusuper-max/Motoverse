import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/comments/[id]/like - Like a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: commentId } = await params

        // Check if comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        // Check if already liked
        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId,
                },
            },
        })

        if (existingLike) {
            return NextResponse.json({ error: 'Already liked' }, { status: 400 })
        }

        // Create like
        await prisma.commentLike.create({
            data: {
                userId: user.id,
                commentId,
            },
        })

        // Get updated like count
        const likeCount = await prisma.commentLike.count({
            where: { commentId },
        })

        return NextResponse.json({
            success: true,
            isLiked: true,
            likeCount,
        })
    } catch (error) {
        console.error('[comments.like.POST] failed', error)
        return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 })
    }
}

// DELETE /api/comments/[id]/like - Unlike a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: commentId } = await params

        // Delete like
        await prisma.commentLike.deleteMany({
            where: {
                userId: user.id,
                commentId,
            },
        })

        // Get updated like count
        const likeCount = await prisma.commentLike.count({
            where: { commentId },
        })

        return NextResponse.json({
            success: true,
            isLiked: false,
            likeCount,
        })
    } catch (error) {
        console.error('[comments.like.DELETE] failed', error)
        return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 })
    }
}
