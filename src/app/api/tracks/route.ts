import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/tracks - List all tracks
export async function GET() {
    try {
        const tracks = await prisma.track.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { times: true },
                },
            },
        })

        return NextResponse.json({ tracks })
    } catch (error) {
        console.error('[api.tracks.GET] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}
