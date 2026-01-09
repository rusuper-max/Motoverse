import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/percentile - Get percentile rankings for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        // Get the car's stats
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: {
                id: true,
                horsepower: true,
                torque: true,
            },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        // Calculate total investment from history
        const historyAgg = await prisma.historyNode.aggregate({
            where: { carId },
            _sum: { cost: true },
        })
        const totalInvestment = historyAgg._sum.cost || 0

        // Get all cars' stats for comparison
        const allCars = await prisma.car.findMany({
            select: {
                id: true,
                horsepower: true,
                torque: true,
            },
        })

        // Get all cars' investments
        const allInvestments = await prisma.historyNode.groupBy({
            by: ['carId'],
            _sum: { cost: true },
        })

        const investmentMap = new Map(
            allInvestments.map((inv) => [inv.carId, inv._sum.cost || 0])
        )

        // Calculate percentiles
        const calculatePercentile = (value: number | null, allValues: number[]): number | null => {
            if (value === null || value === 0) return null
            const validValues = allValues.filter((v) => v > 0)
            if (validValues.length === 0) return null

            const belowCount = validValues.filter((v) => v < value).length
            const percentile = (belowCount / validValues.length) * 100
            // Return "top X%" - so if you're in 90th percentile, you're in top 10%
            return Math.round(100 - percentile)
        }

        const hpValues = allCars.map((c) => c.horsepower || 0)
        const torqueValues = allCars.map((c) => c.torque || 0)
        const investmentValues = Array.from(investmentMap.values())

        const percentiles = {
            horsepower: calculatePercentile(car.horsepower, hpValues),
            torque: calculatePercentile(car.torque, torqueValues),
            investment: calculatePercentile(totalInvestment, investmentValues),
            totalInvestment,
        }

        return NextResponse.json(percentiles)
    } catch (error) {
        console.error('Error calculating percentiles:', error)
        return NextResponse.json(
            { error: 'Failed to calculate percentiles' },
            { status: 500 }
        )
    }
}
