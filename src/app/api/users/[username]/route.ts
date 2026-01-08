import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/users/[username] - Get user profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getSessionUser(req)

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        createdAt: true,
        cars: {
          where: { isPublic: true },
          include: {
            generation: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
            _count: {
              select: {
                posts: true,
                ratings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        posts: {
          where: {
            car: {
              isPublic: true,
            },
          },
          include: {
            car: {
              include: {
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
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            cars: true,
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is following this user
    let isFollowing = false
    let isOwnProfile = false

    if (currentUser) {
      isOwnProfile = currentUser.id === user.id

      if (!isOwnProfile) {
        const followRecord = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.id,
              followingId: user.id,
            },
          },
        })
        isFollowing = !!followRecord
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        isFollowing,
        isOwnProfile,
      },
    })
  } catch (error) {
    console.error('[api.users.username.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
