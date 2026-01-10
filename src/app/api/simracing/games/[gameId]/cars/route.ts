import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ gameId: string }>
}

// GET /api/simracing/games/[gameId]/cars - List cars for a game
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params
    const { searchParams } = new URL(request.url)
    const carClass = searchParams.get('class')

    const game = await prisma.simGame.findFirst({
      where: { OR: [{ slug: gameId }, { id: gameId }] },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const where: any = { gameId: game.id }
    if (carClass) {
      where.class = carClass
    }

    const cars = await prisma.simCar.findMany({
      where,
      include: {
        _count: {
          select: { lapTimes: true },
        },
      },
      orderBy: [{ class: 'asc' }, { name: 'asc' }],
    })

    // Get unique classes for filtering
    const classes = await prisma.simCar.findMany({
      where: { gameId: game.id },
      select: { class: true },
      distinct: ['class'],
    })

    return NextResponse.json({
      cars,
      game,
      classes: classes.map((c) => c.class).filter(Boolean),
    })
  } catch (error) {
    console.error('Error fetching cars:', error)
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
  }
}

// POST /api/simracing/games/[gameId]/cars - Add a car (admin only)
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
    const { name, carClass } = body

    if (!name) {
      return NextResponse.json({ error: 'Car name is required' }, { status: 400 })
    }

    const car = await prisma.simCar.create({
      data: {
        name,
        class: carClass || null,
        gameId: game.id,
      },
    })

    return NextResponse.json({ car }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Car already exists for this game' }, { status: 400 })
    }
    console.error('Error creating car:', error)
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
