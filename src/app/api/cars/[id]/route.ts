import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/cars/[id] - Get a specific car
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        generation: {
          include: {
            model: {
              include: { make: true },
            },
          },
        },
        engineConfig: true,
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Check if car is public or owned by current user
    const user = await getSessionUser(req)
    if (!car.isPublic && car.ownerId !== user?.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('[api.cars.id.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// PATCH /api/cars/[id] - Update a car
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const existingCar = await prisma.car.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existingCar) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    if (existingCar.ownerId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      nickname,
      description,
      image,
      mileage,
      engine,
      transmission,
      drivetrain,
      fuelType,
      horsepower,
      torque,
      color,
      purchaseDate,
      isPublic,
    } = body

    const car = await prisma.car.update({
      where: { id },
      data: {
        nickname: nickname !== undefined ? nickname || null : undefined,
        description: description !== undefined ? description || null : undefined,
        image: image !== undefined ? image || null : undefined,
        mileage: mileage !== undefined ? (mileage ? parseInt(mileage, 10) : null) : undefined,
        engine: engine !== undefined ? engine || null : undefined,
        transmission: transmission !== undefined ? transmission || null : undefined,
        drivetrain: drivetrain !== undefined ? drivetrain || null : undefined,
        fuelType: fuelType !== undefined ? fuelType || null : undefined,
        horsepower: horsepower !== undefined ? (horsepower ? parseInt(horsepower, 10) : null) : undefined,
        torque: torque !== undefined ? (torque ? parseInt(torque, 10) : null) : undefined,
        color: color !== undefined ? color || null : undefined,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
      include: {
        generation: {
          include: {
            model: { include: { make: true } },
          },
        },
        engineConfig: true,
      },
    })

    return NextResponse.json({ car })
  } catch (error) {
    console.error('[api.cars.id.PATCH] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/cars/[id] - Delete a car
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const existingCar = await prisma.car.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existingCar) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    if (existingCar.ownerId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    await prisma.car.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api.cars.id.DELETE] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
