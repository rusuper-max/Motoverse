import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/makes/[id]/models - Get models for a make (with generation counts)
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Find make by ID or slug
    const make = await prisma.carMake.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!make) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const models = await prisma.carModel.findMany({
      where: { makeId: make.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { generations: true },
        },
      },
    })

    return NextResponse.json({ models, make })
  } catch (error) {
    console.error('[api.makes.id.models.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
