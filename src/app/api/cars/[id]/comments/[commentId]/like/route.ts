import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; commentId: string }>
}

// POST /api/cars/[id]/comments/[commentId]/like - Toggle like on a car comment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { commentId } = await params

        // Check if already liked
        const existingLike = await prisma.carCommentLike.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId,
                },
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.carCommentLike.delete({
                where: { id: existingLike.id },
            })

            const likeCount = await prisma.carCommentLike.count({
                where: { commentId },
            })

            return NextResponse.json({ liked: false, likeCount })
        } else {
            // Like
            await prisma.carCommentLike.create({
                data: {
                    userId: user.id,
                    commentId,
                },
            })

            const likeCount = await prisma.carCommentLike.count({
                where: { commentId },
            })

            return NextResponse.json({ liked: true, likeCount })
        }
    } catch (error) {
        console.error('[car-comment-like.POST] failed', error)
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
    }
}
