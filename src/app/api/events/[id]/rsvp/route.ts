import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/events/[id]/rsvp - RSVP to event
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        // Check event exists
        const event = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                maxAttendees: true,
                _count: { select: { attendees: true } },
            },
        })

        if (!event) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 })
        }

        // Check if already at capacity
        if (event.maxAttendees && event._count.attendees >= event.maxAttendees) {
            return NextResponse.json(
                { error: 'event_full', message: 'This event is at capacity' },
                { status: 400 }
            )
        }

        const body = await req.json()
        const { carId, status, lookingForRide, hasEmptySeat } = body

        // If carId provided, verify ownership
        if (carId) {
            const car = await prisma.car.findUnique({
                where: { id: carId },
                select: { ownerId: true },
            })
            if (!car || car.ownerId !== user.id) {
                return NextResponse.json({ error: 'invalid_car' }, { status: 400 })
            }
        }

        // Upsert RSVP (update if exists, create if not)
        const rsvp = await prisma.eventAttendee.upsert({
            where: {
                eventId_userId: {
                    eventId: id,
                    userId: user.id,
                },
            },
            update: {
                carId: carId || null,
                status: status || 'going',
                lookingForRide: lookingForRide || false,
                hasEmptySeat: hasEmptySeat || false,
            },
            create: {
                eventId: id,
                userId: user.id,
                carId: carId || null,
                status: status || 'going',
                lookingForRide: lookingForRide || false,
                hasEmptySeat: hasEmptySeat || false,
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
                user: {
                    select: { id: true, username: true, name: true },
                },
            },
        })

        return NextResponse.json({ rsvp })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[api.events.id.rsvp.POST] failed', { message: errorMessage, error })
        return NextResponse.json({ error: 'failed', message: errorMessage }, { status: 500 })
    }
}

// DELETE /api/events/[id]/rsvp - Cancel RSVP
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sessionUser = await getSessionUser(req)
        if (!sessionUser) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        await prisma.eventAttendee.deleteMany({
            where: {
                eventId: id,
                userId: sessionUser.id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[api.events.id.rsvp.DELETE] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}
