import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/ratings - Get all ratings for a car + average
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        const ratings = await prisma.carRating.findMany({
            where: { carId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Calculate average
        const average = ratings.length > 0
            ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
            : 0

        return NextResponse.json({
            ratings,
            average: Math.round(average * 10) / 10,
            count: ratings.length
        })
    } catch (error) {
        console.error('Error fetching car ratings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ratings' },
            { status: 500 }
        )
    }
}

// POST /api/cars/[id]/ratings - Submit or update rating
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId } = await params
        const body = await request.json()
        const { rating, comment } = body

        // Validate rating
        if (!rating || rating < 1 || rating > 10) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 10' },
                { status: 400 }
            )
        }

        // Check car exists and user doesn't own it
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { ownerId: true },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        if (car.ownerId === user.id) {
            return NextResponse.json(
                { error: 'You cannot rate your own car' },
                { status: 403 }
            )
        }

        // Upsert rating (one per user per car)
        const carRating = await prisma.carRating.upsert({
            where: {
                carId_userId: { carId, userId: user.id },
            },
            update: {
                rating,
                comment: comment || null,
            },
            create: {
                carId,
                userId: user.id,
                rating,
                comment: comment || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ rating: carRating }, { status: 201 })
    } catch (error) {
        console.error('Error submitting rating:', error)
        return NextResponse.json(
            { error: 'Failed to submit rating' },
            { status: 500 }
        )
    }
}
