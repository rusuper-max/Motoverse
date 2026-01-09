import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if user is founder/admin
async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (user.role !== 'founder' && user.role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 }
  }
  return { user }
}

// GET /api/admin - Get admin dashboard stats
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const [
      userCount,
      carCount,
      postCount,
      spotCount,
      verifiedCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.car.count(),
      prisma.post.count(),
      prisma.carSpot.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        users: userCount,
        cars: carCount,
        posts: postCount,
        spots: spotCount,
        verified: verifiedCount,
      },
      recentUsers,
      currentUser: auth.user,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
