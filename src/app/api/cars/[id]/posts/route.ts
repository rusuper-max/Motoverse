import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/cars/[id]/posts - Get all posts for a car (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: carId } = await params

        const posts = await prisma.post.findMany({
            where: { carId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ posts })
    } catch (error) {
        console.error('Error fetching car posts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}

// POST /api/cars/[id]/posts - Create a new post for a car (owner only)
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
                { error: 'You can only post about your own cars' },
                { status: 403 }
            )
        }

        // Validate required fields
        const { title, content, category, mileage, cost, images } = body

        if (!title || !content || !category) {
            return NextResponse.json(
                { error: 'Title, content, and category are required' },
                { status: 400 }
            )
        }

        // Create post
        const post = await prisma.post.create({
            data: {
                title,
                content,
                category,
                mileage: mileage ? parseInt(mileage) : null,
                cost: cost ? parseFloat(cost) : null,
                images: images ? JSON.stringify(images) : null,
                authorId: user.id,
                carId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
        console.error('Error creating post:', error)
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        )
    }
}
