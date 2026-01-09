import { NextRequest, NextResponse } from 'next/server'
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

// GET /api/admin/users - List all users with pagination and search
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const verified = searchParams.get('verified')

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (role) {
    where.role = role
  }

  if (verified !== null && verified !== '') {
    where.isVerified = verified === 'true'
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isVerified: true,
          profileCompleted: true,
          createdAt: true,
          _count: {
            select: {
              cars: true,
              posts: true,
              followers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
