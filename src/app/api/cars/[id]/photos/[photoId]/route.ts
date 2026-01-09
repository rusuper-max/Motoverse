import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; photoId: string }>
}

// GET /api/cars/[id]/photos/[photoId] - Get a single photo with details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { photoId } = await params
        const user = await getSessionUser(request)

        const photo = await prisma.carPhoto.findUnique({
            where: { id: photoId },
            include: {
                uploader: {
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
                        nickname: true,
                        year: true,
                        ownerId: true,
                        generation: {
                            select: {
                                name: true,
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
                ratings: {
                    select: {
                        rating: true,
                        userId: true,
                    },
                },
                comments: {
                    where: { parentId: null },
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
                },
            },
        })

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        // Calculate rating stats
        const avgRating = photo.ratings.length > 0
            ? Math.round(photo.ratings.reduce((sum, r) => sum + r.rating, 0) / photo.ratings.length)
            : null
        const userRating = user
            ? photo.ratings.find(r => r.userId === user.id)?.rating ?? null
            : null

        // Transform comments with isLiked flag
        const commentsWithLikes = photo.comments.map(comment => ({
            ...comment,
            isLiked: user ? comment.likes.some(l => l.userId === user.id) : false,
            likes: undefined,
            replies: comment.replies.map(reply => ({
                ...reply,
                isLiked: user ? reply.likes.some(l => l.userId === user.id) : false,
                likes: undefined,
            })),
        }))

        return NextResponse.json({
            photo: {
                ...photo,
                ratings: undefined,
                comments: commentsWithLikes,
                avgRating,
                userRating,
                ratingCount: photo.ratings.length,
            },
        })
    } catch (error) {
        console.error('[photo.GET] failed', error)
        return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
    }
}

// DELETE /api/cars/[id]/photos/[photoId] - Delete a photo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { photoId } = await params

        const photo = await prisma.carPhoto.findUnique({
            where: { id: photoId },
            select: {
                uploaderId: true,
                car: { select: { ownerId: true } },
            },
        })

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        // Only the uploader or car owner can delete
        if (photo.uploaderId !== user.id && photo.car.ownerId !== user.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        await prisma.carPhoto.delete({
            where: { id: photoId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[photo.DELETE] failed', error)
        return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
    }
}

// PATCH /api/cars/[id]/photos/[photoId] - Update photo caption
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { photoId } = await params
        const body = await request.json()
        const { caption } = body

        const photo = await prisma.carPhoto.findUnique({
            where: { id: photoId },
            select: { uploaderId: true },
        })

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        if (photo.uploaderId !== user.id) {
            return NextResponse.json({ error: 'Only the uploader can edit' }, { status: 403 })
        }

        const updated = await prisma.carPhoto.update({
            where: { id: photoId },
            data: { caption: caption || null },
        })

        return NextResponse.json({ photo: updated })
    } catch (error) {
        console.error('[photo.PATCH] failed', error)
        return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
    }
}
