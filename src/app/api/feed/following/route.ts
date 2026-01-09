import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ActivityType = 'post' | 'car' | 'rating' | 'car_comment' | 'photo'

interface FeedResult {
  id: string
  type: ActivityType
  createdAt: Date
  data: unknown
  activityText: string
}

// GET /api/feed/following - Get activity feed from followed users and cars
export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser(req)

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Get followed user IDs
    const followedUsers = await prisma.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    })
    const followedUserIds = followedUsers.map((f) => f.followingId)

    // Get followed car IDs
    const followedCars = await prisma.carFollow.findMany({
      where: { followerId: currentUser.id },
      select: { carId: true },
    })
    const followedCarIds = followedCars.map((f) => f.carId)

    // If not following anyone, return empty
    if (followedUserIds.length === 0 && followedCarIds.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null })
    }

    const results: FeedResult[] = []

    // Fetch posts from followed users OR about followed cars
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { authorId: { in: followedUserIds } },
          { carId: { in: followedCarIds } },
        ],
        car: { isPublic: true },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        car: {
          select: {
            id: true,
            nickname: true,
            year: true,
            image: true,
            thumbnail: true,
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
      take: limit,
    })

    for (const post of posts) {
      const carName = post.car?.generation
        ? `${post.car.year} ${post.car.generation.model.make.name} ${post.car.generation.model.name}`
        : post.car?.nickname || 'their car'

      results.push({
        id: `post-${post.id}`,
        type: 'post',
        createdAt: post.createdAt,
        activityText: `posted about ${carName}`,
        data: post,
      })
    }

    // Fetch new cars from followed users
    const cars = await prisma.car.findMany({
      where: {
        ownerId: { in: followedUserIds },
        isPublic: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
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
      take: limit,
    })

    for (const car of cars) {
      const carName = car.generation
        ? `${car.year} ${car.generation.model.make.name} ${car.generation.model.name}`
        : car.nickname || 'a new car'

      results.push({
        id: `car-${car.id}`,
        type: 'car',
        createdAt: car.createdAt,
        activityText: `added ${carName} to their garage`,
        data: car,
      })
    }

    // Fetch ratings from followed users OR on followed cars
    const ratings = await prisma.carRating.findMany({
      where: {
        OR: [
          { userId: { in: followedUserIds } },
          { carId: { in: followedCarIds } },
        ],
        car: { isPublic: true },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        car: {
          select: {
            id: true,
            nickname: true,
            year: true,
            image: true,
            thumbnail: true,
            owner: {
              select: {
                id: true,
                username: true,
              },
            },
            generation: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    for (const rating of ratings) {
      const carName = rating.car.generation
        ? `${rating.car.year} ${rating.car.generation.model.make.name} ${rating.car.generation.model.name}`
        : rating.car.nickname || 'a car'

      results.push({
        id: `rating-${rating.id}`,
        type: 'rating',
        createdAt: rating.createdAt,
        activityText: `rated ${carName} ${rating.rating}/10`,
        data: {
          rating: rating.rating,
          comment: rating.comment,
          user: rating.user,
          car: rating.car,
        },
      })
    }

    // Fetch comments on followed cars
    const carComments = await prisma.carComment.findMany({
      where: {
        OR: [
          { authorId: { in: followedUserIds } },
          { carId: { in: followedCarIds } },
        ],
        car: { isPublic: true },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        car: {
          select: {
            id: true,
            nickname: true,
            year: true,
            image: true,
            thumbnail: true,
            owner: {
              select: {
                id: true,
                username: true,
              },
            },
            generation: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    for (const comment of carComments) {
      const carName = comment.car.generation
        ? `${comment.car.year} ${comment.car.generation.model.make.name} ${comment.car.generation.model.name}`
        : comment.car.nickname || 'a car'

      results.push({
        id: `car_comment-${comment.id}`,
        type: 'car_comment',
        createdAt: comment.createdAt,
        activityText: `commented on ${carName}`,
        data: {
          content: comment.content,
          author: comment.author,
          car: comment.car,
        },
      })
    }

    // Fetch photos from followed users OR on followed cars
    const photos = await prisma.carPhoto.findMany({
      where: {
        OR: [
          { uploaderId: { in: followedUserIds } },
          { carId: { in: followedCarIds } },
        ],
        car: { isPublic: true },
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        car: {
          select: {
            id: true,
            nickname: true,
            year: true,
            owner: {
              select: {
                id: true,
                username: true,
              },
            },
            generation: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    for (const photo of photos) {
      const carName = photo.car.generation
        ? `${photo.car.year} ${photo.car.generation.model.make.name} ${photo.car.generation.model.name}`
        : photo.car.nickname || 'their car'

      const avgRating = photo.ratings.length > 0
        ? Math.round(photo.ratings.reduce((sum, r) => sum + r.rating, 0) / photo.ratings.length)
        : null

      results.push({
        id: `photo-${photo.id}`,
        type: 'photo',
        createdAt: photo.createdAt,
        activityText: `added a photo of ${carName}`,
        data: {
          id: photo.id,
          url: photo.url,
          thumbnail: photo.thumbnail,
          caption: photo.caption,
          uploader: photo.uploader,
          car: photo.car,
          avgRating,
          ratingCount: photo._count.ratings,
          commentCount: photo._count.comments,
        },
      })
    }

    // Sort combined results by date
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Limit results
    const finalResults = results.slice(0, limit)

    return NextResponse.json({
      items: finalResults,
      nextCursor: null,
    })
  } catch (error) {
    console.error('[api.feed.following.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
