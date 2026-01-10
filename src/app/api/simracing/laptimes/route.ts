import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// Helper to format time
function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

// GET /api/simracing/laptimes - List lap times
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const trackId = searchParams.get('trackId')
    const carId = searchParams.get('carId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const user = await getSessionUser()

    const where: any = {}

    if (gameId) {
      const game = await prisma.simGame.findFirst({
        where: { OR: [{ slug: gameId }, { id: gameId }] },
      })
      if (game) where.gameId = game.id
    }

    if (trackId) where.trackId = trackId
    if (carId) where.carId = carId
    if (userId) where.userId = userId
    if (status) where.status = status

    // Non-admins can only see verified times (or their own)
    if (!user || user.role !== 'admin') {
      if (user) {
        where.OR = [{ status: 'verified' }, { userId: user.id }]
      } else {
        where.status = 'verified'
      }
    }

    const [lapTimes, total] = await Promise.all([
      prisma.simLapTime.findMany({
        where,
        include: {
          game: {
            select: { id: true, name: true, shortName: true, slug: true },
          },
          track: {
            select: { id: true, name: true, configuration: true, country: true },
          },
          car: {
            select: { id: true, name: true, class: true },
          },
          user: {
            select: { id: true, username: true, name: true, avatar: true },
          },
        },
        orderBy: { timeMs: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.simLapTime.count({ where }),
    ])

    return NextResponse.json({
      lapTimes: lapTimes.map((lt) => ({
        ...lt,
        timeFormatted: formatLapTime(lt.timeMs),
      })),
      total,
      hasMore: offset + lapTimes.length < total,
    })
  } catch (error) {
    console.error('Error fetching lap times:', error)
    return NextResponse.json({ error: 'Failed to fetch lap times' }, { status: 500 })
  }
}

// POST /api/simracing/laptimes - Submit a lap time
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, trackId, carId, timeMs, weather, assists, proofUrl, proofType, setupNotes } = body

    if (!gameId || !trackId || !carId || !timeMs) {
      return NextResponse.json({
        error: 'gameId, trackId, carId, and timeMs are required',
      }, { status: 400 })
    }

    if (typeof timeMs !== 'number' || timeMs <= 0) {
      return NextResponse.json({ error: 'Invalid lap time' }, { status: 400 })
    }

    // Verify game, track, and car exist
    const [game, track, car] = await Promise.all([
      prisma.simGame.findFirst({ where: { OR: [{ slug: gameId }, { id: gameId }] } }),
      prisma.simTrack.findUnique({ where: { id: trackId } }),
      prisma.simCar.findUnique({ where: { id: carId } }),
    ])

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (!track || track.gameId !== game.id) {
      return NextResponse.json({ error: 'Track not found for this game' }, { status: 404 })
    }
    if (!car || car.gameId !== game.id) {
      return NextResponse.json({ error: 'Car not found for this game' }, { status: 404 })
    }

    const lapTime = await prisma.simLapTime.create({
      data: {
        timeMs,
        timeFormatted: formatLapTime(timeMs),
        weather: weather || null,
        assists: assists || null,
        proofUrl: proofUrl || null,
        proofType: proofType || null,
        setupNotes: setupNotes || null,
        status: 'pending',
        gameId: game.id,
        trackId,
        carId,
        userId: user.id,
      },
      include: {
        game: { select: { id: true, name: true, shortName: true } },
        track: { select: { id: true, name: true, configuration: true } },
        car: { select: { id: true, name: true, class: true } },
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ lapTime }, { status: 201 })
  } catch (error) {
    console.error('Error creating lap time:', error)
    return NextResponse.json({ error: 'Failed to submit lap time' }, { status: 500 })
  }
}
