import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/spots/[id] - Get a single spot with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const user = await getSessionUser(request)

  try {
    const spot = await prisma.carSpot.findUnique({
      where: { id },
      include: {
        spotter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        guesses: {
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
          orderBy: { createdAt: 'asc' },
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

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // Get average rarity rating
    const avgRating = await prisma.carSpotRating.aggregate({
      where: { spotId: id },
      _avg: { rating: true },
    })

    // Get user's rating if logged in
    let userRating = null
    if (user) {
      const rating = await prisma.carSpotRating.findUnique({
        where: {
          spotId_userId: {
            spotId: id,
            userId: user.id,
          },
        },
      })
      userRating = rating?.rating || null
    }

    // Get user's guess if logged in
    let userGuess = null
    if (user) {
      const guess = await prisma.carSpotGuess.findUnique({
        where: {
          spotId_userId: {
            spotId: id,
            userId: user.id,
          },
        },
      })
      userGuess = guess
    }

    const isRevealed = spot.revealedAt !== null
    const isOwner = user?.id === spot.spotterId

    // Hide correct answer and guesses if challenge not revealed (unless owner)
    return NextResponse.json({
      spot: {
        ...spot,
        correctAnswer: isRevealed || isOwner ? spot.correctAnswer : undefined,
        // Only show guesses if revealed or user is owner
        guesses: isRevealed || isOwner ? spot.guesses : spot.guesses.map(g => ({
          ...g,
          isCorrect: isRevealed ? g.isCorrect : undefined,
        })),
        avgRarity: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
        userRating,
        userGuess: userGuess ? {
          make: userGuess.make,
          model: userGuess.model,
          year: userGuess.year,
          isCorrect: isRevealed ? userGuess.isCorrect : undefined,
        } : null,
        isOwner,
      },
    })
  } catch (error) {
    console.error('Failed to fetch spot:', error)
    return NextResponse.json({ error: 'Failed to fetch spot' }, { status: 500 })
  }
}

// PATCH /api/spots/[id] - Update a spot (reveal answer, update identification)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    if (spot.spotterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reveal, make, model, year, caption, locationName } = body

    const updateData: Record<string, unknown> = {}

    // Reveal the answer for a challenge
    if (reveal && spot.isChallenge && !spot.revealedAt) {
      updateData.revealedAt = new Date()

      // Mark guesses as correct/incorrect based on the correct answer
      const correctParts = spot.correctAnswer?.toLowerCase().split(' ') || []

      const guesses = await prisma.carSpotGuess.findMany({
        where: { spotId: id },
      })

      // Simple matching - check if make and model are in the correct answer
      for (const guess of guesses) {
        const guessMake = guess.make.toLowerCase()
        const guessModel = guess.model.toLowerCase()
        const isCorrect = correctParts.some(p => p.includes(guessMake) || guessMake.includes(p)) &&
                          correctParts.some(p => p.includes(guessModel) || guessModel.includes(p))

        await prisma.carSpotGuess.update({
          where: { id: guess.id },
          data: { isCorrect },
        })
      }

      // Parse the correct answer to set make/model
      if (spot.correctAnswer) {
        const parts = spot.correctAnswer.split(' ')
        if (parts.length >= 2) {
          updateData.make = parts[0]
          updateData.model = parts.slice(1).join(' ')
        }
        updateData.isIdentified = true
      }
    }

    // Update basic fields
    if (make !== undefined) updateData.make = make
    if (model !== undefined) updateData.model = model
    if (year !== undefined) updateData.year = year ? parseInt(year) : null
    if (caption !== undefined) updateData.caption = caption
    if (locationName !== undefined) updateData.locationName = locationName

    // Mark as identified if make is set
    if (updateData.make) {
      updateData.isIdentified = true
    }

    const updatedSpot = await prisma.carSpot.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ spot: updatedSpot })
  } catch (error) {
    console.error('Failed to update spot:', error)
    return NextResponse.json({ error: 'Failed to update spot' }, { status: 500 })
  }
}

// DELETE /api/spots/[id] - Delete a spot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    if (spot.spotterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.carSpot.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete spot:', error)
    return NextResponse.json({ error: 'Failed to delete spot' }, { status: 500 })
  }
}
