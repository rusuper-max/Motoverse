import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/performance - Get performance times for a car with rankings
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        // Get the car's make/model info
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: {
                generation: {
                    select: {
                        model: {
                            select: {
                                id: true,
                                name: true,
                                makeId: true,
                                make: { select: { id: true, name: true } }
                            }
                        }
                    }
                }
            }
        })

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

        // Calculate rankings for approved times
        const timesWithRankings = await Promise.all(times.map(async (time) => {
            if (time.status !== 'approved') {
                return { ...time, rankings: null }
            }

            // Global ranking for this category
            const globalRank = await prisma.performanceTime.count({
                where: {
                    category: time.category,
                    status: 'approved',
                    timeMs: { lt: time.timeMs }
                }
            }) + 1

            const globalTotal = await prisma.performanceTime.count({
                where: { category: time.category, status: 'approved' }
            })

            // Make ranking
            let makeRank = null
            let makeTotal = null
            let makeName = null
            if (car?.generation?.model?.makeId) {
                makeName = car.generation.model.make.name
                makeRank = await prisma.performanceTime.count({
                    where: {
                        category: time.category,
                        status: 'approved',
                        timeMs: { lt: time.timeMs },
                        car: {
                            generation: {
                                model: { makeId: car.generation.model.makeId }
                            }
                        }
                    }
                }) + 1

                makeTotal = await prisma.performanceTime.count({
                    where: {
                        category: time.category,
                        status: 'approved',
                        car: {
                            generation: {
                                model: { makeId: car.generation.model.makeId }
                            }
                        }
                    }
                })
            }

            // Model ranking
            let modelRank = null
            let modelTotal = null
            let modelName = null
            if (car?.generation?.model?.id) {
                modelName = `${car.generation.model.make.name} ${car.generation.model.name}`
                modelRank = await prisma.performanceTime.count({
                    where: {
                        category: time.category,
                        status: 'approved',
                        timeMs: { lt: time.timeMs },
                        car: {
                            generation: { modelId: car.generation.model.id }
                        }
                    }
                }) + 1

                modelTotal = await prisma.performanceTime.count({
                    where: {
                        category: time.category,
                        status: 'approved',
                        car: {
                            generation: { modelId: car.generation.model.id }
                        }
                    }
                })
            }

            return {
                ...time,
                rankings: {
                    global: { rank: globalRank, total: globalTotal },
                    make: makeRank ? { rank: makeRank, total: makeTotal, name: makeName } : null,
                    model: modelRank ? { rank: modelRank, total: modelTotal, name: modelName } : null,
                }
            }
        }))

        return NextResponse.json({ times: timesWithRankings })
    } catch (error) {
        console.error('Error fetching performance times:', error)
        return NextResponse.json(
            { error: 'Failed to fetch performance times' },
            { status: 500 }
        )
    }
}
