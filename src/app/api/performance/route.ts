import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/performance - List performance times with filters
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const makeSlug = searchParams.get('make')
        const modelSlug = searchParams.get('model')
        const status = searchParams.get('status') || 'approved'
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        const where: Record<string, unknown> = {}

        if (category) {
            where.category = category
        }

        if (status) {
            where.status = status
        }

        // Filter by make/model through car relation
        if (makeSlug || modelSlug) {
            where.car = {
                generation: {
                    model: {
                        ...(modelSlug ? { slug: modelSlug } : {}),
                        make: makeSlug ? { slug: makeSlug } : undefined,
                    },
                },
            }
        }

        const times = await prisma.performanceTime.findMany({
            where,
            orderBy: { timeMs: 'asc' },
            take: limit,
            include: {
                car: {
                    include: {
                        generation: {
                            include: {
                                model: {
                                    include: { make: true },
                                },
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                track: true,
            },
        })

        return NextResponse.json({ times })
    } catch (error) {
        console.error('[api.performance.GET] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}

// POST /api/performance - Submit a new performance time
export async function POST(req: Request) {
    try {
        const sessionUser = await getSessionUser(req)
        if (!sessionUser) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'session_expired', message: 'Your session is invalid.' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            carId,
            category,
            timeMs,
            trackId,
            proofUrl,
            proofType,
            runDate,
            location,
            weather,
            altitude,
        } = body

        // Validate required fields
        if (!carId || !category || !timeMs) {
            return NextResponse.json(
                { error: 'missing_fields', message: 'carId, category, and timeMs are required' },
                { status: 400 }
            )
        }

        // Validate category
        const validCategories = ['0-100', '100-200', '200-300', '402m', '1000m', 'track']
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { error: 'invalid_category', message: 'Invalid category' },
                { status: 400 }
            )
        }

        // Verify car ownership
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: {
                ownerId: true,
                estimatedHp: true,
                horsepower: true,
                curbWeight: true,
                modifications: true,
            },
        })

        if (!car) {
            return NextResponse.json({ error: 'car_not_found' }, { status: 404 })
        }

        if (car.ownerId !== user.id) {
            return NextResponse.json({ error: 'not_your_car' }, { status: 403 })
        }

        // Create the performance time
        const performanceTime = await prisma.performanceTime.create({
            data: {
                carId,
                userId: user.id,
                category,
                timeMs: parseInt(String(timeMs), 10),
                trackId: trackId || null,
                proofUrl: proofUrl || null,
                proofType: proofType || null,
                runDate: runDate ? new Date(runDate) : new Date(),
                location: location || null,
                weather: weather || null,
                altitude: altitude ? parseInt(String(altitude), 10) : null,
                // Snapshot car state at time of submission
                carHp: car.estimatedHp || car.horsepower || null,
                carWeight: car.curbWeight || null,
                carMods: car.modifications || null,
                status: 'pending', // All submissions start as pending
            },
            include: {
                car: {
                    include: {
                        generation: {
                            include: {
                                model: { include: { make: true } },
                            },
                        },
                    },
                },
                track: true,
            },
        })

        return NextResponse.json({ performanceTime })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[api.performance.POST] failed', { message: errorMessage, error })
        return NextResponse.json({ error: 'failed', message: errorMessage }, { status: 500 })
    }
}
