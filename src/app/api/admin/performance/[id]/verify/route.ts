import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/performance/[id]/verify - Verify a performance time
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
    const { status, reviewNote } = body // status: 'approved' | 'rejected' | 'pending'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if performance time exists
    const performanceTime = await prisma.performanceTime.findUnique({
      where: { id },
      include: {
        car: {
          select: {
            id: true,
            nickname: true,
            owner: { select: { id: true, username: true } }
          }
        }
      }
    })

    if (!performanceTime) {
      return NextResponse.json({ error: 'Performance time not found' }, { status: 404 })
    }

    const updated = await prisma.performanceTime.update({
      where: { id },
      data: {
        status,
        reviewedAt: status !== 'pending' ? new Date() : null,
        reviewNote: reviewNote || null,
      },
      include: {
        car: {
          select: {
            id: true,
            nickname: true,
            generation: {
              select: {
                displayName: true,
                model: {
                  select: {
                    name: true,
                    make: { select: { name: true } }
                  }
                }
              }
            }
          }
        },
        user: { select: { id: true, username: true, avatar: true } }
      }
    })

    return NextResponse.json({
      success: true,
      performanceTime: updated,
      message: `Performance time ${status}`
    })
  } catch (error) {
    console.error('[api.admin.performance.id.verify.POST] failed', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
