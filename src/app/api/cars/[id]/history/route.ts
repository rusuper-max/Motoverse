import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/history - Get all history nodes for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        const nodes = await prisma.historyNode.findMany({
            where: { carId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        })

        return NextResponse.json({ nodes })
    } catch (error) {
        console.error('Error fetching history nodes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        )
    }
}

// POST /api/cars/[id]/history - Create a new history node
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId } = await params
        const body = await request.json()

        // Verify user owns this car
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { ownerId: true },
        })

        if (!car) {
            return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        if (car.ownerId !== user.id) {
            return NextResponse.json(
                { error: 'You can only add history to your own cars' },
                { status: 403 }
            )
        }

        // Validate required fields
        const { type, title, description, date, mileage, cost, postId, parentId } = body

        if (!type || !title || !date) {
            return NextResponse.json(
                { error: 'Type, title, and date are required' },
                { status: 400 }
            )
        }

        // Create node
        const node = await prisma.historyNode.create({
            data: {
                carId,
                authorId: user.id,
                type,
                title,
                description: description || null,
                date: new Date(date),
                mileage: mileage ? Number(mileage) : null,
                cost: cost ? Number(cost) : null,
                postId: postId || null,
                parentId: parentId || null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })

        return NextResponse.json({ node }, { status: 201 })
    } catch (error) {
        console.error('Error creating history node:', error)
        return NextResponse.json(
            { error: 'Failed to create history node' },
            { status: 500 }
        )
    }
}
