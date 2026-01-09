import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; photoId: string; commentId: string }>
}

// POST /api/cars/[id]/photos/[photoId]/comments/[commentId]/like - Toggle like
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { commentId } = await params

        // Check if already liked
        const existingLike = await prisma.carPhotoCommentLike.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId,
                },
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.carPhotoCommentLike.delete({
                where: { id: existingLike.id },
            })

            const count = await prisma.carPhotoCommentLike.count({
                where: { commentId },
            })

            return NextResponse.json({ liked: false, likeCount: count })
        } else {
            // Like
            await prisma.carPhotoCommentLike.create({
                data: {
                    userId: user.id,
                    commentId,
                },
            })

            const count = await prisma.carPhotoCommentLike.count({
                where: { commentId },
            })

            return NextResponse.json({ liked: true, likeCount: count })
        }
    } catch (error) {
        console.error('[photoCommentLike.POST] failed', error)
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
    }
}
