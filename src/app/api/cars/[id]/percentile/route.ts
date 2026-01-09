import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/percentile - Get percentile rankings for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        // Get the car's stats with generation info for make/model filtering
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: {
                id: true,
                horsepower: true,
                torque: true,
                make: true,
                model: true,
                generation: {
                    select: {
                        model: {
                            select: {
                                id: true,
                                name: true,
                                make: {
                                    select: {
                                        id: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                },
                owner: {
                    select: {
                        country: true,
                    }
                }
            },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        // Get make/model info
        const makeName = car.generation?.model?.make?.name || car.make
        const modelName = car.generation?.model?.name || car.model
        const makeId = car.generation?.model?.make?.id
        const modelId = car.generation?.model?.id
        const ownerCountry = car.owner?.country

        // Calculate total investment from history
        const historyAgg = await prisma.historyNode.aggregate({
            where: { carId },
            _sum: { cost: true },
        })
        const totalInvestment = historyAgg._sum.cost || 0

        // Get all cars' stats for global comparison
        const allCars = await prisma.car.findMany({
            where: { isPublic: true },
            select: {
                id: true,
                horsepower: true,
                torque: true,
                generation: {
                    select: {
                        model: {
                            select: {
                                id: true,
                                makeId: true,
                            }
                        }
                    }
                },
                owner: {
                    select: { country: true }
                }
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

        // Calculate ranking (1 = best, returns rank and total count)
        const calculateRanking = (value: number | null, allValues: number[]): { rank: number; total: number; percentile: number } | null => {
            if (value === null || value === 0) return null
            const validValues = allValues.filter((v) => v > 0).sort((a, b) => b - a) // Sort descending
            if (validValues.length === 0) return null

            const rank = validValues.findIndex(v => v <= value) + 1
            const total = validValues.length

            // For small samples (< 10), use rank-based percentile
            // For larger samples, use traditional percentile
            let percentile: number
            if (total < 10) {
                // With small samples, being #1 of 2 = Top 1%, #2 of 2 = Top 50%
                percentile = Math.max(1, Math.round((rank / total) * 100))
            } else {
                const belowCount = validValues.filter((v) => v < value).length
                percentile = Math.round(100 - (belowCount / validValues.length) * 100)
            }

            return { rank, total, percentile: Math.max(1, percentile) }
        }

        // Filter cars by make
        const sameMakeCars = allCars.filter(c =>
            (c.generation?.model?.makeId === makeId) ||
            (makeId === undefined && c.generation === null)
        )

        // Filter cars by model
        const sameModelCars = allCars.filter(c =>
            (c.generation?.model?.id === modelId) ||
            (modelId === undefined && c.generation === null)
        )

        // Filter cars by country
        const sameCountryCars = ownerCountry
            ? allCars.filter(c => c.owner?.country === ownerCountry)
            : []

        // Global values
        const hpValues = allCars.map((c) => c.horsepower || 0)
        const torqueValues = allCars.map((c) => c.torque || 0)
        const investmentValues = Array.from(investmentMap.values())

        // Per-make values
        const makeHpValues = sameMakeCars.map((c) => c.horsepower || 0)
        const makeTorqueValues = sameMakeCars.map((c) => c.torque || 0)

        // Per-model values
        const modelHpValues = sameModelCars.map((c) => c.horsepower || 0)
        const modelTorqueValues = sameModelCars.map((c) => c.torque || 0)

        // Per-country values
        const countryHpValues = sameCountryCars.map((c) => c.horsepower || 0)
        const countryTorqueValues = sameCountryCars.map((c) => c.torque || 0)

        const result = {
            // Global rankings
            horsepower: calculateRanking(car.horsepower, hpValues),
            torque: calculateRanking(car.torque, torqueValues),
            investment: calculateRanking(totalInvestment, investmentValues),
            totalInvestment,

            // Per-make rankings
            horsepowerInMake: makeName ? calculateRanking(car.horsepower, makeHpValues) : null,
            torqueInMake: makeName ? calculateRanking(car.torque, makeTorqueValues) : null,
            makeName,

            // Per-model rankings
            horsepowerInModel: modelName ? calculateRanking(car.horsepower, modelHpValues) : null,
            torqueInModel: modelName ? calculateRanking(car.torque, modelTorqueValues) : null,
            modelName,

            // Per-country rankings
            horsepowerInCountry: ownerCountry ? calculateRanking(car.horsepower, countryHpValues) : null,
            torqueInCountry: ownerCountry ? calculateRanking(car.torque, countryTorqueValues) : null,
            country: ownerCountry,
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error calculating percentiles:', error)
        return NextResponse.json(
            { error: 'Failed to calculate percentiles' },
            { status: 500 }
        )
    }
}
