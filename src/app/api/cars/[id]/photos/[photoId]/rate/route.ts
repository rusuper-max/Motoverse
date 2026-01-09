import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; photoId: string }>
}

// POST /api/cars/[id]/photos/[photoId]/rate - Rate a photo (rev limiter style 0-10000)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { photoId } = await params
        const body = await request.json()
        const { rating } = body

        // Validate rating (0-10000 RPM)
        if (typeof rating !== 'number' || rating < 0 || rating > 10000) {
            return NextResponse.json({ error: 'Rating must be between 0 and 10000' }, { status: 400 })
        }

        // Verify photo exists
        const photo = await prisma.carPhoto.findUnique({
            where: { id: photoId },
            select: { uploaderId: true },
        })

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        // Don't allow rating your own photos
        if (photo.uploaderId === user.id) {
            return NextResponse.json({ error: 'Cannot rate your own photo' }, { status: 400 })
        }

        // Upsert the rating
        const photoRating = await prisma.carPhotoRating.upsert({
            where: {
                photoId_userId: {
                    photoId,
                    userId: user.id,
                },
            },
            update: { rating },
            create: {
                rating,
                photoId,
                userId: user.id,
            },
        })

        // Get updated average
        const allRatings = await prisma.carPhotoRating.findMany({
            where: { photoId },
            select: { rating: true },
        })

        const avgRating = Math.round(
            allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        )

        return NextResponse.json({
            rating: photoRating.rating,
            avgRating,
            ratingCount: allRatings.length,
        })
    } catch (error) {
        console.error('[photo.rate.POST] failed', error)
        return NextResponse.json({ error: 'Failed to rate photo' }, { status: 500 })
    }
}

// DELETE /api/cars/[id]/photos/[photoId]/rate - Remove rating
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { photoId } = await params

        await prisma.carPhotoRating.deleteMany({
            where: {
                photoId,
                userId: user.id,
            },
        })

        // Get updated average
        const allRatings = await prisma.carPhotoRating.findMany({
            where: { photoId },
            select: { rating: true },
        })

        const avgRating = allRatings.length > 0
            ? Math.round(allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length)
            : null

        return NextResponse.json({
            avgRating,
            ratingCount: allRatings.length,
        })
    } catch (error) {
        console.error('[photo.rate.DELETE] failed', error)
        return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 })
    }
}
