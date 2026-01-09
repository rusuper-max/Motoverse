import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/spots/[id]/guess - Submit a guess for a challenge spot
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

    // Can't guess on non-challenge spots
    if (!spot.isChallenge) {
      return NextResponse.json({ error: 'This is not a challenge spot' }, { status: 400 })
    }

    // Can't guess if already revealed
    if (spot.revealedAt) {
      return NextResponse.json({ error: 'This challenge has already been revealed' }, { status: 400 })
    }

    // Can't guess on your own spot
    if (spot.spotterId === user.id) {
      return NextResponse.json({ error: 'You cannot guess on your own spot' }, { status: 400 })
    }

    // Check if user already guessed
    const existingGuess = await prisma.carSpotGuess.findUnique({
      where: {
        spotId_userId: {
          spotId: id,
          userId: user.id,
        },
      },
    })

    if (existingGuess) {
      return NextResponse.json({ error: 'You have already guessed on this spot' }, { status: 400 })
    }

    const body = await request.json()
    const { make, model, year } = body

    if (!make || !model) {
      return NextResponse.json({ error: 'Make and model are required' }, { status: 400 })
    }

    const guess = await prisma.carSpotGuess.create({
      data: {
        make,
        model,
        year: year ? parseInt(year) : null,
        spotId: id,
        userId: user.id,
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

    return NextResponse.json({ guess }, { status: 201 })
  } catch (error) {
    console.error('Failed to submit guess:', error)
    return NextResponse.json({ error: 'Failed to submit guess' }, { status: 500 })
  }
}
