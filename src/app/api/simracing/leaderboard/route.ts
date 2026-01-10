import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to format time
function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

// GET /api/simracing/leaderboard - Get leaderboard for a specific track/car combo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const trackId = searchParams.get('trackId')
    const carId = searchParams.get('carId')
    const carClass = searchParams.get('class')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!gameId || !trackId) {
      return NextResponse.json({
        error: 'gameId and trackId are required',
      }, { status: 400 })
    }

    const game = await prisma.simGame.findFirst({
      where: { OR: [{ slug: gameId }, { id: gameId }] },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const track = await prisma.simTrack.findFirst({
      where: {
        OR: [{ slug: trackId }, { id: trackId }],
        gameId: game.id,
      },
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const where: any = {
      gameId: game.id,
      trackId: track.id,
      status: 'verified',
    }

    if (carId) {
      where.carId = carId
    }

    if (carClass) {
      where.car = { class: carClass }
    }

    // Get best time per user (one entry per user)
    const lapTimes = await prisma.simLapTime.findMany({
      where,
      include: {
        car: { select: { id: true, name: true, class: true } },
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
      orderBy: { timeMs: 'asc' },
    })

    // Group by user and keep only best time
    const userBestTimes = new Map<string, typeof lapTimes[0]>()
    for (const lt of lapTimes) {
      if (!userBestTimes.has(lt.userId) || lt.timeMs < userBestTimes.get(lt.userId)!.timeMs) {
        userBestTimes.set(lt.userId, lt)
      }
    }

    // Convert to array and sort
    const sortedTimes = Array.from(userBestTimes.values())
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, limit)

    const fastestTime = sortedTimes[0]?.timeMs || 0

    const leaderboard = sortedTimes.map((lt, index) => ({
      position: index + 1,
      ...lt,
      timeFormatted: formatLapTime(lt.timeMs),
      gap: index === 0 ? null : `+${formatLapTime(lt.timeMs - fastestTime)}`,
    }))

    // Get track record
    const trackRecord = leaderboard[0] || null

    // Get available car classes for this track
    const availableClasses = await prisma.simLapTime.findMany({
      where: {
        gameId: game.id,
        trackId: track.id,
        status: 'verified',
      },
      select: {
        car: { select: { class: true } },
      },
      distinct: ['carId'],
    })

    const classes = [...new Set(availableClasses.map((lt) => lt.car.class).filter(Boolean))]

    return NextResponse.json({
      game: { id: game.id, name: game.name, shortName: game.shortName },
      track: { id: track.id, name: track.name, configuration: track.configuration, country: track.country },
      leaderboard,
      trackRecord,
      availableClasses: classes,
      totalEntries: userBestTimes.size,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
