import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/photos - Get all photos for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params
        const user = await getSessionUser(request)

        const photos = await prisma.carPhoto.findMany({
            where: { carId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                ratings: {
                    select: {
                        rating: true,
                        userId: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        ratings: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Calculate average rating and check if user has rated
        const photosWithRatings = photos.map(photo => {
            const avgRating = photo.ratings.length > 0
                ? Math.round(photo.ratings.reduce((sum, r) => sum + r.rating, 0) / photo.ratings.length)
                : null
            const userRating = user
                ? photo.ratings.find(r => r.userId === user.id)?.rating ?? null
                : null

            return {
                ...photo,
                ratings: undefined, // Don't expose all ratings
                avgRating,
                userRating,
                ratingCount: photo._count.ratings,
                commentCount: photo._count.comments,
            }
        })

        return NextResponse.json({ photos: photosWithRatings })
    } catch (error) {
        console.error('[photos.GET] failed', error)
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    }
}

// POST /api/cars/[id]/photos - Upload a photo
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId } = await params
        const body = await request.json()
        const { url, thumbnail, caption } = body

        if (!url) {
            return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 })
        }

        // Verify the car exists and user is the owner
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { ownerId: true },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        if (car.ownerId !== user.id) {
            return NextResponse.json({ error: 'Only the car owner can upload photos' }, { status: 403 })
        }

        const photo = await prisma.carPhoto.create({
            data: {
                url,
                thumbnail: thumbnail || null,
                caption: caption || null,
                carId,
                uploaderId: user.id,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({
            photo: {
                ...photo,
                avgRating: null,
                userRating: null,
                ratingCount: 0,
                commentCount: 0,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('[photos.POST] failed', error)
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }
}
