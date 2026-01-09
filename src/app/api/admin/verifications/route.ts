import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/admin/verifications - Get pending verifications
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins, moderators and founders can access
    if (!user.role || !['admin', 'founder', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // all, performance, dyno, vin

    // Get pending performance times
    const pendingPerformance = type === 'all' || type === 'performance'
      ? await prisma.performanceTime.findMany({
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            car: {
              select: {
                id: true,
                nickname: true,
                year: true,
                horsepower: true,
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
            user: { select: { id: true, username: true, avatar: true } },
            track: { select: { name: true } }
          }
        })
      : []

    // Get cars with unverified dyno claims (has proof but not verified)
    const pendingDyno = type === 'all' || type === 'dyno'
      ? await prisma.car.findMany({
          where: {
            dynoProofUrl: { not: null },
            dynoVerified: false,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            nickname: true,
            year: true,
            horsepower: true,
            torque: true,
            estimatedHp: true,
            estimatedTorque: true,
            dynoProofUrl: true,
            dynoVerified: true,
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
            },
            owner: { select: { id: true, username: true, avatar: true } }
          }
        })
      : []

    // Get cars with unverified VIN (has VIN but not verified)
    const pendingVin = type === 'all' || type === 'vin'
      ? await prisma.car.findMany({
          where: {
            vin: { not: null },
            vinVerified: false,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            nickname: true,
            year: true,
            vin: true,
            vinProofUrl: true,
            vinVerified: true,
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
            },
            owner: { select: { id: true, username: true, avatar: true } }
          }
        })
      : []

    return NextResponse.json({
      pendingPerformance,
      pendingDyno,
      pendingVin,
      counts: {
        performance: pendingPerformance.length,
        dyno: pendingDyno.length,
        vin: pendingVin.length,
        total: pendingPerformance.length + pendingDyno.length + pendingVin.length
      }
    })
  } catch (error) {
    console.error('[api.admin.verifications.GET] failed', error)
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
  }
}
