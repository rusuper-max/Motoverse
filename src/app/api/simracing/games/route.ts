import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET /api/simracing/games - List all games
export async function GET() {
  try {
    const games = await prisma.simGame.findMany({
      include: {
        _count: {
          select: { tracks: true, cars: true, lapTimes: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

// POST /api/simracing/games - Create a new game (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { name, shortName, logo, coverImage, platform } = body

    if (!name) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const game = await prisma.simGame.create({
      data: {
        name,
        slug,
        shortName: shortName || null,
        logo: logo || null,
        coverImage: coverImage || null,
        platform: platform || [],
      },
    })

    return NextResponse.json({ game }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Game already exists' }, { status: 400 })
    }
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
