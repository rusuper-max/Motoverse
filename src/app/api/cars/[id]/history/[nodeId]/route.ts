import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string; nodeId: string }>
}

// PATCH /api/cars/[id]/history/[nodeId] - Update a history node
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId, nodeId } = await params
        const body = await request.json()

        // Verify user owns this car
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { ownerId: true },
        })

        if (!car || car.ownerId !== user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        // Check node exists and belongs to this car
        const existingNode = await prisma.historyNode.findFirst({
            where: { id: nodeId, carId },
        })

        if (!existingNode) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        if (existingNode.isLocked) {
            return NextResponse.json({ error: 'Node is locked' }, { status: 403 })
        }

        // Update fields
        const updateData: Record<string, unknown> = {}

        if (body.positionX !== undefined) updateData.positionX = Number(body.positionX)
        if (body.positionY !== undefined) updateData.positionY = Number(body.positionY)
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.type !== undefined) updateData.type = body.type
        if (body.date !== undefined) updateData.date = new Date(body.date)
        if (body.mileage !== undefined) updateData.mileage = body.mileage ? Number(body.mileage) : null
        if (body.cost !== undefined) updateData.cost = body.cost ? Number(body.cost) : null
        if (body.parentId !== undefined) updateData.parentId = body.parentId || null
        if (body.postId !== undefined) updateData.postId = body.postId || null

        const node = await prisma.historyNode.update({
            where: { id: nodeId },
            data: updateData,
        })

        return NextResponse.json({ node })
    } catch (error) {
        console.error('Error updating history node:', error)
        return NextResponse.json(
            { error: 'Failed to update node' },
            { status: 500 }
        )
    }
}

// DELETE /api/cars/[id]/history/[nodeId] - Delete a history node
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getSessionUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: carId, nodeId } = await params

        // Verify user owns this car
        const car = await prisma.car.findUnique({
            where: { id: carId },
            select: { ownerId: true },
        })

        if (!car || car.ownerId !== user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        // Check node exists and belongs to this car
        const existingNode = await prisma.historyNode.findFirst({
            where: { id: nodeId, carId },
        })

        if (!existingNode) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        if (existingNode.isLocked) {
            return NextResponse.json({ error: 'Node is locked' }, { status: 403 })
        }

        await prisma.historyNode.delete({
            where: { id: nodeId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting history node:', error)
        return NextResponse.json(
            { error: 'Failed to delete node' },
            { status: 500 }
        )
    }
}
