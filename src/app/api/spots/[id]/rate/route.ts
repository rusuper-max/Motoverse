import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/spots/[id]/rate - Rate the rarity of a spot
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const user = await getSessionUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const spot = await prisma.carSpot.findUnique({
      where: { id },
    })

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    const body = await request.json()
    const { rating } = body

    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    // Upsert the rating
    const ratingRecord = await prisma.carSpotRating.upsert({
      where: {
        spotId_userId: {
          spotId: id,
          userId: user.id,
        },
      },
      update: { rating },
      create: {
        rating,
        spotId: id,
        userId: user.id,
      },
    })

    // Calculate new average
    const avgRating = await prisma.carSpotRating.aggregate({
      where: { spotId: id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // Update the spot's cached rarity score
    await prisma.carSpot.update({
      where: { id },
      data: {
        rarityScore: avgRating._avg.rating ? Math.round(avgRating._avg.rating) : null,
      },
    })

    return NextResponse.json({
      rating: ratingRecord.rating,
      avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
      ratingCount: avgRating._count.rating,
    })
  } catch (error) {
    console.error('Failed to rate spot:', error)
    return NextResponse.json({ error: 'Failed to rate spot' }, { status: 500 })
  }
}
