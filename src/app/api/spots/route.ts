import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET /api/spots - List all spots with pagination and filtering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const filter = searchParams.get('filter') || 'all' // all, challenges, mine
  const search = searchParams.get('q')?.trim().toLowerCase()

  const user = await getSessionUser(request)

  // Build where clause
  const where: Record<string, unknown> = {}

  if (filter === 'challenges') {
    where.isChallenge = true
  } else if (filter === 'mine' && user) {
    where.spotterId = user.id
  }

  if (search) {
    where.OR = [
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { locationName: { contains: search, mode: 'insensitive' } },
      { caption: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const spots = await prisma.carSpot.findMany({
      where,
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        spotter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            guesses: true,
            comments: true,
            ratings: true,
          },
        },
      },
    })

    // Calculate average rarity for each spot and check if user has guessed
    const spotsWithData = await Promise.all(
      spots.map(async (spot) => {
        // Get average rarity rating
        const avgRating = await prisma.carSpotRating.aggregate({
          where: { spotId: spot.id },
          _avg: { rating: true },
        })

        // Check if current user has guessed (for challenges)
        let userGuess = null
        if (user && spot.isChallenge) {
          userGuess = await prisma.carSpotGuess.findUnique({
            where: {
              spotId_userId: {
                spotId: spot.id,
                userId: user.id,
              },
            },
          })
        }

        // Hide correct answer if challenge not revealed
        const isRevealed = spot.revealedAt !== null

        return {
          ...spot,
          correctAnswer: isRevealed ? spot.correctAnswer : undefined,
          avgRarity: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
          hasGuessed: !!userGuess,
          userGuess: userGuess ? {
            make: userGuess.make,
            model: userGuess.model,
            isCorrect: userGuess.isCorrect,
          } : null,
        }
      })
    )

    const nextCursor = spots.length === limit ? spots[spots.length - 1]?.id : null

    return NextResponse.json({
      spots: spotsWithData,
      nextCursor,
    })
  } catch (error) {
    console.error('Failed to fetch spots:', error)
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 })
  }
}

// POST /api/spots - Create a new spot
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      imageUrl,
      thumbnail,
      caption,
      latitude,
      longitude,
      locationName,
      make,
      model,
      year,
      isChallenge,
      correctAnswer,
    } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // If it's a challenge, require correct answer
    if (isChallenge && !correctAnswer) {
      return NextResponse.json({ error: 'Correct answer is required for challenges' }, { status: 400 })
    }

    const spot = await prisma.carSpot.create({
      data: {
        imageUrl,
        thumbnail,
        caption,
        latitude,
        longitude,
        locationName,
        make: isChallenge ? null : make, // Don't store make/model if it's a challenge
        model: isChallenge ? null : model,
        year: isChallenge ? null : (year ? parseInt(year) : null),
        isChallenge: !!isChallenge,
        correctAnswer: isChallenge ? correctAnswer : null,
        isIdentified: !isChallenge && !!make, // Identified if make is provided and not a challenge
        spotterId: user.id,
      },
      include: {
        spotter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ spot }, { status: 201 })
  } catch (error) {
    console.error('Failed to create spot:', error)
    return NextResponse.json({ error: 'Failed to create spot' }, { status: 500 })
  }
}
