import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/events/[id] - Get event details
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const event = await prisma.event.findUnique({
            where: { id },
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
                                avatar: true,
                                location: true,
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
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!event) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 })
        }

        // Group attendees by car make for "Who's Going" feature
        const carMakeCounts: Record<string, number> = {}
        event.attendees.forEach(att => {
            if (att.car?.generation?.model?.make?.name) {
                const make = att.car.generation.model.make.name
                carMakeCounts[make] = (carMakeCounts[make] || 0) + 1
            }
        })

        return NextResponse.json({
            event,
            carMakeCounts, // "3 BMWs going!", "2 Audis going!"
        })
    } catch (error) {
        console.error('[api.events.id.GET] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}

// DELETE /api/events/[id] - Delete event (organizer only)
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

        const event = await prisma.event.findUnique({
            where: { id },
            select: { organizerId: true },
        })

        if (!event) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 })
        }

        if (event.organizerId !== sessionUser.id) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        }

        await prisma.event.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[api.events.id.DELETE] failed', error)
        return NextResponse.json({ error: 'failed' }, { status: 500 })
    }
}
