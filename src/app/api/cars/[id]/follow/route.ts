import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/cars/[id]/follow - Check if user follows this car
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: carId } = await params
    const user = await getSessionUser(request)

    if (!user) {
      return NextResponse.json({ isFollowing: false, followerCount: 0 })
    }

    const [follow, followerCount] = await Promise.all([
      prisma.carFollow.findUnique({
        where: {
          followerId_carId: {
            followerId: user.id,
            carId,
          },
        },
      }),
      prisma.carFollow.count({
        where: { carId },
      }),
    ])

    return NextResponse.json({
      isFollowing: !!follow,
      followerCount,
    })
  } catch (error) {
    console.error('[car.follow.GET] failed', error)
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 })
  }
}

// POST /api/cars/[id]/follow - Follow a car
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: carId } = await params

    // Check if car exists and is public
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, isPublic: true, ownerId: true },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    if (!car.isPublic) {
      return NextResponse.json({ error: 'Cannot follow private car' }, { status: 403 })
    }

    // Can't follow your own car
    if (car.ownerId === user.id) {
      return NextResponse.json({ error: 'Cannot follow your own car' }, { status: 400 })
    }

    // Create follow
    await prisma.carFollow.create({
      data: {
        followerId: user.id,
        carId,
      },
    })

    const followerCount = await prisma.carFollow.count({
      where: { carId },
    })

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followerCount,
    })
  } catch (error: unknown) {
    // Handle unique constraint (already following)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Already following this car' }, { status: 409 })
    }
    console.error('[car.follow.POST] failed', error)
    return NextResponse.json({ error: 'Failed to follow car' }, { status: 500 })
  }
}

// DELETE /api/cars/[id]/follow - Unfollow a car
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: carId } = await params

    await prisma.carFollow.delete({
      where: {
        followerId_carId: {
          followerId: user.id,
          carId,
        },
      },
    })

    const followerCount = await prisma.carFollow.count({
      where: { carId },
    })

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followerCount,
    })
  } catch (error: unknown) {
    // Handle not found (wasn't following)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not following this car' }, { status: 404 })
    }
    console.error('[car.follow.DELETE] failed', error)
    return NextResponse.json({ error: 'Failed to unfollow car' }, { status: 500 })
  }
}
