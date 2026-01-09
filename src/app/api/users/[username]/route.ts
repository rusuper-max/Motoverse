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
        email: true,
        name: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        country: true,
        accountType: true,
        website: true,
        socialLinks: true,
        isVerified: true,
        role: true,
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

    // Only include email for own profile
    const responseUser = {
      ...user,
      email: isOwnProfile ? user.email : undefined,
      isFollowing,
      isOwnProfile,
    }

    return NextResponse.json({
      user: responseUser,
    })
  } catch (error) {
    console.error('[api.users.username.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// PATCH /api/users/[username] - Update user profile
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getSessionUser(req)

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user being updated
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow updating own profile
    if (targetUser.id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      bio,
      avatar,
      coverImage,
      location,
      country,
      accountType,
      website,
      socialLinks,
    } = body

    // Validate account type if provided
    const validAccountTypes = ['enthusiast', 'mechanic', 'tuner', 'dealer', 'racer', 'collector']
    if (accountType && !validAccountTypes.includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    // Check if profile is being completed
    const isCompletingProfile = (name || bio || country || accountType) && !currentUser.profileCompleted

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: name !== undefined ? name || null : undefined,
        bio: bio !== undefined ? bio || null : undefined,
        avatar: avatar !== undefined ? avatar || null : undefined,
        coverImage: coverImage !== undefined ? coverImage || null : undefined,
        location: location !== undefined ? location || null : undefined,
        country: country !== undefined ? country || null : undefined,
        accountType: accountType !== undefined ? accountType || null : undefined,
        website: website !== undefined ? website || null : undefined,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        profileCompleted: isCompletingProfile ? true : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        country: true,
        accountType: true,
        website: true,
        socialLinks: true,
        profileCompleted: true,
        isVerified: true,
        role: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('[api.users.username.PATCH] failed', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
