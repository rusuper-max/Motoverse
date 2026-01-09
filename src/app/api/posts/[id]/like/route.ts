import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { notifyPostAuthorAboutLike } from '@/lib/notifications'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/posts/[id]/like - Toggle like
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: postId } = await params

        const existingLike = await prisma.like.findFirst({
            where: {
                postId,
                userId: user.id,
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: { id: existingLike.id },
            })
            return NextResponse.json({ liked: false })
        } else {
            // Like
            await prisma.like.create({
                data: {
                    postId,
                    userId: user.id,
                },
            })
            // Notify post author about the like
            await notifyPostAuthorAboutLike(postId, user.id)
            return NextResponse.json({ liked: true })
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
    }
}
