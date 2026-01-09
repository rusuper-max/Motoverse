import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/cars/[id]/verify - Verify car stats (HP, torque, VIN)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and founders can verify
    if (!user.role || !['admin', 'founder', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { verificationType, verified, note } = body

    // Check if car exists
    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true, ownerId: true }
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const now = new Date()
    let updateData: Record<string, unknown> = {}

    switch (verificationType) {
      case 'hp':
        updateData = {
          dynoVerified: verified,
          hpVerifiedAt: verified ? now : null,
          hpVerifiedBy: verified ? user.id : null,
          // If dyno verified, it's not just "stock" anymore
          isStockPower: verified ? false : undefined,
        }
        break

      case 'torque':
        updateData = {
          torqueVerified: verified,
          torqueVerifiedAt: verified ? now : null,
          torqueVerifiedBy: verified ? user.id : null,
        }
        break

      case 'vin':
        updateData = {
          vinVerified: verified,
          vinVerifiedAt: verified ? now : null,
          vinVerifiedBy: verified ? user.id : null,
        }
        break

      case 'stock':
        // Mark as stock power (admin-verified factory specs)
        updateData = {
          isStockPower: verified,
          stockMarkedAt: verified ? now : null,
          stockMarkedBy: verified ? user.id : null,
          // Clear dyno verification if marking as stock
          dynoVerified: verified ? false : undefined,
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 })
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        dynoVerified: true,
        hpVerifiedAt: true,
        torqueVerified: true,
        torqueVerifiedAt: true,
        vinVerified: true,
        vinVerifiedAt: true,
        vin: true,
        isStockPower: true,
        stockMarkedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      car: updatedCar,
      message: `${verificationType.toUpperCase()} ${verified ? 'verified' : 'unverified'}`
    })
  } catch (error) {
    console.error('[api.admin.cars.id.verify.POST] failed', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
