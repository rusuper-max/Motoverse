import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/events - List events with filters
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const city = searchParams.get('city')
        const type = searchParams.get('type')
        const upcoming = searchParams.get('upcoming') !== 'false'
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        const where: Record<string, unknown> = {
            isPublic: true,
        }

        if (city) {
            where.city = { contains: city }
        }

        if (type) {
            where.type = type
        }

        // Only show upcoming events by default
        if (upcoming) {
            where.date = { gte: new Date() }
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { date: 'asc' },
            take: limit,
            include: {
                organizer: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                attendees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                            },
                        },
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
                    },
                },
                _count: {
                    select: { attendees: true },
                },
            },
        })

        return NextResponse.json({ events })
    } catch (error) {
        console.error('[api.events.GET] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}

// POST /api/events - Create new event
export async function POST(req: Request) {
    try {
        const sessionUser = await getSessionUser(req)
        if (!sessionUser) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'session_expired' }, { status: 401 })
        }

        const body = await req.json()
        const {
            title,
            description,
            type,
            location,
            address,
            city,
            country,
            lat,
            lng,
            date,
            endDate,
            maxAttendees,
            coverImage,
        } = body

        if (!title || !location || !date) {
            return NextResponse.json(
                { error: 'missing_fields', message: 'title, location, and date are required' },
                { status: 400 }
            )
        }

        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                type: type || 'meet',
                location,
                address: address || null,
                city: city || null,
                country: country || null,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : null,
                maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
                coverImage: coverImage || null,
                organizerId: user.id,
            },
            include: {
                organizer: {
                    select: { id: true, username: true, name: true },
                },
            },
        })

        return NextResponse.json({ event })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[api.events.POST] failed', { message: errorMessage, error })
        return NextResponse.json({ error: 'failed', message: errorMessage }, { status: 500 })
    }
}
