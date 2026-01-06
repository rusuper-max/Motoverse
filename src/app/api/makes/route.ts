import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET /api/makes - Get all car makes
export async function GET() {
  try {
    const makes = await prisma.carMake.findMany({
      orderBy: [
        { isPopular: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { models: true },
        },
      },
    })

    return NextResponse.json({ makes })
  } catch (error) {
    console.error('[api.makes.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
