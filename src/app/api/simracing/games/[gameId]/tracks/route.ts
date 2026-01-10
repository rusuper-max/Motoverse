import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ gameId: string }>
}

// GET /api/simracing/games/[gameId]/tracks - List tracks for a game
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params

    const game = await prisma.simGame.findFirst({
      where: { OR: [{ slug: gameId }, { id: gameId }] },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const tracks = await prisma.simTrack.findMany({
      where: { gameId: game.id },
      include: {
        _count: {
          select: { lapTimes: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ tracks, game })
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
  }
}

// POST /api/simracing/games/[gameId]/tracks - Add a track (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params
    const user = await getSessionUser()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const game = await prisma.simGame.findFirst({
      where: { OR: [{ slug: gameId }, { id: gameId }] },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, country, lengthMeters, configuration } = body

    if (!name) {
      return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const track = await prisma.simTrack.create({
      data: {
        name,
        slug,
        country: country || null,
        lengthMeters: lengthMeters || null,
        configuration: configuration || null,
        gameId: game.id,
      },
    })

    return NextResponse.json({ track }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Track already exists for this game' }, { status: 400 })
    }
    console.error('Error creating track:', error)
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 })
  }
}
