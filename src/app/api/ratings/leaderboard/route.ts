import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CarWithRatings {
    id: string
    year: number
    nickname: string | null
    image: string | null
    owner: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    generation: {
        name: string
        displayName: string | null
        model: {
            name: string
            make: { name: string; slug: string }
        }
    } | null
    ratings: { rating: number }[]
}

// GET /api/ratings/leaderboard - Get top rated cars
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '20')

        // Get cars with their ratings (only those with at least 1 rating)
        const carsWithRatings = await prisma.car.findMany({
            where: {
                isPublic: true,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                generation: {
                    include: {
                        model: {
                            include: {
                                make: true,
                            },
                        },
                    },
                },
                ratings: {
                    select: {
                        rating: true,
                    },
                },
            },
        }) as unknown as CarWithRatings[]

        // Calculate average rating for each car and sort
        const carsWithAvgRating = carsWithRatings
            .filter(car => car.ratings.length >= 1)  // At least 1 rating
            .map(car => ({
                id: car.id,
                year: car.year,
                nickname: car.nickname,
                image: car.image,
                owner: car.owner,
                generation: car.generation,
                ratingCount: car.ratings.length,
                avgRating: car.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / car.ratings.length,
            }))
            .sort((a, b) => {
                // Sort by average rating (desc), then by count (desc)
                if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
                return b.ratingCount - a.ratingCount
            })
            .slice(0, limit)

        return NextResponse.json({ cars: carsWithAvgRating })
    } catch (error) {
        console.error('Error fetching ratings leaderboard:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }
}
