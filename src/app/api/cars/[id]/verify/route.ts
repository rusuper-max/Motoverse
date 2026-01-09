import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/cars/[id]/verify - Submit verification request or verify (admin/founder)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, dynoProofUrl, horsepower, torque } = body

    // Get the car
    const car = await prisma.car.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        dynoVerified: true,
        horsepower: true,
        torque: true,
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Get the full user to check role
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    })

    const isPrivileged = fullUser?.role === 'admin' || fullUser?.role === 'founder'
    const isOwner = car.ownerId === user.id

    if (action === 'submit') {
      // Car owner submitting proof for verification
      if (!isOwner) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      if (!dynoProofUrl) {
        return NextResponse.json({ error: 'missing_proof', message: 'Please upload dyno proof' }, { status: 400 })
      }

      const updatedCar = await prisma.car.update({
        where: { id },
        data: {
          dynoProofUrl,
          // Optionally update HP/torque if provided
          ...(horsepower && { horsepower: parseInt(horsepower, 10) }),
          ...(torque && { torque: parseInt(torque, 10) }),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Verification request submitted',
        car: updatedCar,
      })
    }

    if (action === 'approve') {
      // Admin/founder approving verification
      if (!isPrivileged) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      const updatedCar = await prisma.car.update({
        where: { id },
        data: {
          dynoVerified: true,
          hpVerifiedBy: user.id,
          // Update HP/torque if provided by admin
          ...(horsepower && { horsepower: parseInt(horsepower, 10) }),
          ...(torque && { torque: parseInt(torque, 10) }),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Car verified',
        car: updatedCar,
      })
    }

    if (action === 'reject') {
      // Admin/founder rejecting verification
      if (!isPrivileged) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      const updatedCar = await prisma.car.update({
        where: { id },
        data: {
          dynoVerified: false,
          dynoProofUrl: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Verification rejected',
        car: updatedCar,
      })
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  } catch (error) {
    console.error('[api.cars.id.verify.POST] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// GET /api/cars/[id]/verify - Get verification status
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      select: {
        dynoVerified: true,
        dynoProofUrl: true,
        hpVerifiedBy: true,
        horsepower: true,
        torque: true,
        engineConfig: {
          select: {
            horsepower: true,
            torque: true,
          },
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Determine if stock
    const isStockHp = car.engineConfig?.horsepower && car.horsepower === car.engineConfig.horsepower
    const isStockTorque = car.engineConfig?.torque && car.torque === car.engineConfig.torque

    return NextResponse.json({
      dynoVerified: car.dynoVerified,
      hasPendingProof: !!car.dynoProofUrl && !car.dynoVerified,
      dynoProofUrl: car.dynoProofUrl,
      isStockHp,
      isStockTorque,
      stockHp: car.engineConfig?.horsepower,
      stockTorque: car.engineConfig?.torque,
    })
  } catch (error) {
    console.error('[api.cars.id.verify.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
