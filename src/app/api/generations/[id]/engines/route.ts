import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/generations/[id]/engines - Get engine configs for a generation
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const generation = await prisma.carGeneration.findUnique({
      where: { id },
      include: {
        model: {
          include: { make: true },
        },
      },
    })

    if (!generation) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const engines = await prisma.engineConfig.findMany({
      where: { generationId: generation.id },
      orderBy: [{ fuelType: 'asc' }, { horsepower: 'desc' }],
    })

    return NextResponse.json({ engines, generation })
  } catch (error) {
    console.error('[api.generations.id.engines.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
