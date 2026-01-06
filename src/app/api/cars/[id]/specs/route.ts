import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PATCH /api/cars/[id]/specs - Update car detailed specs
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const sessionUser = await getSessionUser(req)
        if (!sessionUser) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        // Verify user exists
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

        // Get the car and verify ownership
        const existingCar = await prisma.car.findUnique({
            where: { id },
            select: { ownerId: true }
        })

        if (!existingCar) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 })
        }

        if (existingCar.ownerId !== user.id) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const {
            // Weight
            curbWeight,
            weightWithDriver,
            // Wheels
            wheelSizeFront,
            wheelSizeRear,
            wheelBrand,
            wheelModel,
            wheelOffset,
            // Tires
            tireSizeFront,
            tireSizeRear,
            tireBrand,
            tireModel,
            tireCompound,
            // Suspension
            suspensionType,
            suspensionBrand,
            suspensionDrop,
            // Brakes
            brakeFrontSize,
            brakeRearSize,
            brakeBrand,
            brakeType,
            // Modifications (free text)
            modifications,
            // Power estimates
            estimatedHp,
            estimatedTorque,
            dynoVerified,
        } = body

        const car = await prisma.car.update({
            where: { id },
            data: {
                // Weight
                curbWeight: curbWeight ? parseInt(curbWeight, 10) : null,
                weightWithDriver: weightWithDriver ? parseInt(weightWithDriver, 10) : null,
                // Wheels
                wheelSizeFront: wheelSizeFront || null,
                wheelSizeRear: wheelSizeRear || null,
                wheelBrand: wheelBrand || null,
                wheelModel: wheelModel || null,
                wheelOffset: wheelOffset || null,
                // Tires
                tireSizeFront: tireSizeFront || null,
                tireSizeRear: tireSizeRear || null,
                tireBrand: tireBrand || null,
                tireModel: tireModel || null,
                tireCompound: tireCompound || null,
                // Suspension
                suspensionType: suspensionType || null,
                suspensionBrand: suspensionBrand || null,
                suspensionDrop: suspensionDrop || null,
                // Brakes
                brakeFrontSize: brakeFrontSize || null,
                brakeRearSize: brakeRearSize || null,
                brakeBrand: brakeBrand || null,
                brakeType: brakeType || null,
                // Modifications (free text)
                modifications: modifications || null,
                // Power estimates
                estimatedHp: estimatedHp ? parseInt(estimatedHp, 10) : null,
                estimatedTorque: estimatedTorque ? parseInt(estimatedTorque, 10) : null,
                dynoVerified: dynoVerified || false,
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[api.cars.id.specs.PATCH] failed', { message: errorMessage, error })
        return NextResponse.json({ error: 'failed', message: errorMessage }, { status: 500 })
    }
}
