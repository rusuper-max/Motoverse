import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/feed - Get public feed of posts and cars
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const type = searchParams.get('type') || 'all' // 'all', 'posts', 'cars'
    const currentUser = await getSessionUser(req)

    const results: {
      id: string
      type: 'post' | 'car'
      createdAt: Date
      data: unknown
    }[] = []

    // Fetch posts
    if (type === 'all' || type === 'posts') {
      const posts = await prisma.post.findMany({
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
        results.push({
          id: post.id,
          type: 'post',
          createdAt: post.createdAt,
          data: {
            ...post,
            isLiked: currentUser ? post.likes.length > 0 : false,
            likes: undefined, // Remove the likes array, just keep _count
          },
        })
      }
    }

    // Fetch recently added public cars
    if (type === 'all' || type === 'cars') {
      const cars = await prisma.car.findMany({
        where: {
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
        ...(cursor && type === 'cars' ? { cursor: { id: cursor }, skip: 1 } : {}),
      })

      for (const car of cars) {
        results.push({
          id: car.id,
          type: 'car',
          createdAt: car.createdAt,
          data: car,
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
