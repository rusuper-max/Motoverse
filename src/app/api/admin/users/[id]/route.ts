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

// Check if user is founder (highest privilege)
async function requireFounder() {
  const user = await getSessionUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (user.role !== 'founder') {
    return { error: 'Forbidden - Founder access required', status: 403 }
  }
  return { user }
}

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        cars: {
          select: {
            id: true,
            nickname: true,
            year: true,
            image: true,
            generation: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            spots: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id] - Update user (verify, change role, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check target user first
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get current admin user
  const adminAuth = await getSessionUser()
  if (!adminAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await request.json()
  const { isVerified, role, name, bio } = body

  // Role change validation
  if (role !== undefined) {
    // Only founder can change roles
    if (adminAuth.role !== 'founder') {
      return NextResponse.json(
        { error: 'Only founders can change user roles' },
        { status: 403 }
      )
    }

    // Cannot change founder role
    if (targetUser.role === 'founder' && role !== 'founder') {
      return NextResponse.json(
        { error: 'Cannot demote a founder' },
        { status: 403 }
      )
    }

    // Valid roles
    const validRoles = ['user', 'moderator', 'admin', 'founder']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
  }

  // Admin can verify users
  if (isVerified !== undefined) {
    if (adminAuth.role !== 'founder' && adminAuth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required to verify users' },
        { status: 403 }
      )
    }
  }

  try {
    const updateData: Record<string, unknown> = {}

    if (isVerified !== undefined) updateData.isVerified = isVerified
    if (role !== undefined) updateData.role = role
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isVerified: true,
        bio: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user (founder only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFounder()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  // Cannot delete yourself
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: 'Cannot delete your own account from admin panel' },
      { status: 400 }
    )
  }

  // Cannot delete other founders
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (targetUser.role === 'founder') {
    return NextResponse.json(
      { error: 'Cannot delete a founder account' },
      { status: 403 }
    )
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
