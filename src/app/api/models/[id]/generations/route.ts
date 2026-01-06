import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/models/[id]/generations - Get generations for a model
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Find model by ID or slug
    const model = await prisma.carModel.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        make: true,
      },
    })

    if (!model) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const generations = await prisma.carGeneration.findMany({
      where: { modelId: model.id },
      orderBy: { startYear: 'desc' },
      include: {
        _count: {
          select: { engines: true, cars: true },
        },
      },
    })

    return NextResponse.json({ generations, model })
  } catch (error) {
    console.error('[api.models.id.generations.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
