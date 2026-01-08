import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/performance - Get performance times for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        const times = await prisma.performanceTime.findMany({
            where: { carId },
            include: {
                track: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: [
                { category: 'asc' },
                { timeMs: 'asc' },
            ],
        })

        return NextResponse.json({ times })
    } catch (error) {
        console.error('Error fetching performance times:', error)
        return NextResponse.json(
            { error: 'Failed to fetch performance times' },
            { status: 500 }
        )
    }
}
