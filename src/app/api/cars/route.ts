import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/cars - Get current user's cars
export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const cars = await prisma.car.findMany({
      where: { ownerId: user.id },
      include: {
        generation: {
          include: {
            model: {
              include: { make: true },
            },
          },
        },
        engineConfig: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cars })
  } catch (error) {
    console.error('[api.cars.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// POST /api/cars - Add a new car to garage
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req)
    if (!sessionUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Verify user still exists in database (handles case where session references deleted user)
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'session_expired', message: 'Your session is invalid. Please log out and log in again.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      generationId,
      engineConfigId,
      year,
      nickname,
      description,
      image, // Legacy field
      images, // New gallery field
      thumbnail, // New thumbnail field
      mileage,
      // Custom engine specs (used when no engineConfigId or for overrides)
      engine,
      transmission,
      drivetrain,
      fuelType,
      horsepower,
      torque,
      color,
      purchaseDate,
      isPublic = true,
    } = body

    // Validate required fields
    if (!generationId || !year) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Generation and year are required' },
        { status: 400 }
      )
    }

    // Validate year
    const currentYear = new Date().getFullYear()
    if (year < 1900 || year > currentYear + 1) {
      return NextResponse.json(
        { error: 'invalid_year', message: 'Invalid year' },
        { status: 400 }
      )
    }

    // Check if generation exists
    const generation = await prisma.carGeneration.findUnique({
      where: { id: generationId },
      include: { model: { include: { make: true } } },
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'generation_not_found', message: 'Car generation not found' },
        { status: 404 }
      )
    }

    // Validate year is within generation range
    if (year < generation.startYear || (generation.endYear && year > generation.endYear)) {
      return NextResponse.json(
        { error: 'year_out_of_range', message: `Year must be between ${generation.startYear} and ${generation.endYear || 'present'}` },
        { status: 400 }
      )
    }

    // If engineConfigId provided, fetch engine specs
    let engineSpecs: {
      engine?: string
      transmission?: string
      drivetrain?: string
      fuelType?: string
      horsepower?: number
      torque?: number
    } = {}

    if (engineConfigId) {
      const engineConfig = await prisma.engineConfig.findUnique({
        where: { id: engineConfigId },
      })

      if (engineConfig && engineConfig.generationId === generationId) {
        engineSpecs = {
          engine: engineConfig.name,
          transmission: engineConfig.transmission || undefined,
          drivetrain: engineConfig.drivetrain || undefined,
          fuelType: engineConfig.fuelType,
          horsepower: engineConfig.horsepower || undefined,
          torque: engineConfig.torque || undefined,
        }
      }
    }

    // Determine primary image
    const primaryImage = image || thumbnail || (images && images.length > 0 ? images[0] : null)

    // Create the car
    const car = await prisma.car.create({
      data: {
        ownerId: user.id,
        generationId,
        engineConfigId: engineConfigId || null,
        year,
        nickname: nickname || null,
        description: description || null,
        image: primaryImage,
        images: images || [],
        thumbnail: thumbnail || primaryImage,
        mileage: mileage ? parseInt(mileage, 10) : null,
        engine: engine || engineSpecs.engine || null,
        transmission: transmission || engineSpecs.transmission || null,
        drivetrain: drivetrain || engineSpecs.drivetrain || null,
        fuelType: fuelType || engineSpecs.fuelType || null,
        horsepower: horsepower ? parseInt(horsepower, 10) : (engineSpecs.horsepower || null),
        torque: torque ? parseInt(torque, 10) : (engineSpecs.torque || null),
        color: color || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        isPublic,
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

    return NextResponse.json({ car }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[api.cars.POST] failed', {
      message: errorMessage,
      stack: errorStack,
      error
    })
    return NextResponse.json({
      error: 'failed',
      message: `Server error: ${errorMessage}`,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
