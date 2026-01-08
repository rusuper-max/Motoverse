import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/users/[username]/follow - Follow a user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getSessionUser(req)

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Find user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, username: true },
    })

    if (!userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't follow yourself
    if (userToFollow.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userToFollow.id,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow record
    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: userToFollow.id,
      },
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: userToFollow.id },
    })

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followerCount,
    })
  } catch (error) {
    console.error('[api.users.username.follow.POST] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/users/[username]/follow - Unfollow a user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getSessionUser(req)

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Find user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    })

    if (!userToUnfollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete follow record
    await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: userToUnfollow.id,
      },
    })

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: userToUnfollow.id },
    })

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followerCount,
    })
  } catch (error) {
    console.error('[api.users.username.follow.DELETE] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
