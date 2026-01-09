import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ActivityType = 'post' | 'car' | 'rating' | 'car_comment'

interface FeedResult {
  id: string
  type: ActivityType
  createdAt: Date
  data: unknown
  activityText: string
}

// GET /api/feed - Get public activity feed
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const type = searchParams.get('type') || 'all' // 'all', 'posts', 'cars', 'activity'
    const searchQuery = searchParams.get('q')?.trim().toLowerCase()
    const currentUser = await getSessionUser(req)

    const results: FeedResult[] = []

    // Fetch posts (blog entries)
    if (type === 'all' || type === 'posts' || type === 'activity') {
      const posts = await prisma.post.findMany({
        where: {
          car: {
            isPublic: true,
          },
          ...(searchQuery ? {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { content: { contains: searchQuery, mode: 'insensitive' } },
              { car: { nickname: { contains: searchQuery, mode: 'insensitive' } } },
              { car: { generation: { model: { name: { contains: searchQuery, mode: 'insensitive' } } } } },
              { car: { generation: { model: { make: { name: { contains: searchQuery, mode: 'insensitive' } } } } } },
              { author: { username: { contains: searchQuery, mode: 'insensitive' } } },
              { author: { name: { contains: searchQuery, mode: 'insensitive' } } },
            ],
          } : {}),
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
              images: true,
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
          likes: currentUser ? {
            where: { userId: currentUser.id },
            select: { id: true },
          } : false,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })

      for (const post of posts) {
        const carName = post.car?.generation
          ? `${post.car.year} ${post.car.generation.model.make.name} ${post.car.generation.model.name}`
          : post.car?.nickname || 'their car'

        results.push({
          id: `post-${post.id}`,
          type: 'post',
          createdAt: post.createdAt,
          activityText: `posted a new blog entry about ${carName}`,
          data: {
            ...post,
            isLiked: currentUser ? (Array.isArray(post.likes) && post.likes.length > 0) : false,
            likes: undefined,
          },
        })
      }
    }

    // Fetch recently added public cars
    if (type === 'all' || type === 'cars' || type === 'activity') {
      const cars = await prisma.car.findMany({
        where: {
          isPublic: true,
          ...(searchQuery ? {
            OR: [
              { nickname: { contains: searchQuery, mode: 'insensitive' } },
              { engine: { contains: searchQuery, mode: 'insensitive' } },
              { generation: { model: { name: { contains: searchQuery, mode: 'insensitive' } } } },
              { generation: { model: { make: { name: { contains: searchQuery, mode: 'insensitive' } } } } },
              { owner: { username: { contains: searchQuery, mode: 'insensitive' } } },
              { owner: { name: { contains: searchQuery, mode: 'insensitive' } } },
            ],
          } : {}),
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
        ...(cursor && type === 'cars' ? { cursor: { id: cursor }, skip: 1 } : {}),
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
    }

    // Fetch recent ratings (for activity feed)
    if (type === 'all' || type === 'activity') {
      const ratings = await prisma.carRating.findMany({
        where: {
          car: {
            isPublic: true,
          },
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
    }

    // Fetch recent car comments (for activity feed)
    if (type === 'all' || type === 'activity') {
      const carComments = await prisma.carComment.findMany({
        where: {
          car: {
            isPublic: true,
          },
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
    }

    // Sort combined results by date
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Limit results
    const finalResults = results.slice(0, limit)
    const nextCursor = finalResults.length === limit ? finalResults[finalResults.length - 1]?.id : null

    return NextResponse.json({
      items: finalResults,
      nextCursor,
    })
  } catch (error) {
    console.error('[api.feed.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
