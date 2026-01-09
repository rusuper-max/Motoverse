import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/leaderboards/investment - Get cars ranked by total investment
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        // Get all car investments from history nodes
        const carInvestments = await prisma.historyNode.groupBy({
            by: ['carId'],
            _sum: { cost: true },
            having: {
                cost: { _sum: { gt: 0 } }
            },
            orderBy: { _sum: { cost: 'desc' } },
            take: limit,
        })

        const carIds = carInvestments.map(c => c.carId)

        // Get car details
        const cars = await prisma.car.findMany({
            where: { id: { in: carIds } },
            select: {
                id: true,
                year: true,
                nickname: true,
                image: true,
                make: true,
                model: true,
                generation: {
                    select: {
                        name: true,
                        displayName: true,
                        model: {
                            select: {
                                name: true,
                                make: { select: { name: true, slug: true } },
                            },
                        },
                    },
                },
                owner: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
        })

        // Build the leaderboard
        const leaderboard = carInvestments.map(inv => {
            const car = cars.find(c => c.id === inv.carId)
            return {
                carId: inv.carId,
                totalInvestment: inv._sum.cost || 0,
                car,
            }
        }).filter(item => item.car) // Only include cars that exist

        return NextResponse.json({ leaderboard })
    } catch (error) {
        console.error('Error fetching investment leaderboard:', error)
        return NextResponse.json(
            { error: 'Failed to fetch investment leaderboard' },
            { status: 500 }
        )
    }
}
