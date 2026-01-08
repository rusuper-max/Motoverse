import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/search - Search users, cars, and posts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()
    const type = searchParams.get('type') || 'all' // 'all', 'users', 'cars', 'posts'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        cars: [],
        posts: []
      })
    }

    const results: {
      users: unknown[]
      cars: unknown[]
      posts: unknown[]
    } = {
      users: [],
      cars: [],
      posts: [],
    }

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              cars: true,
              followers: true,
            },
          },
        },
        take: limit,
        orderBy: [
          { followers: { _count: 'desc' } },
        ],
      })
    }

    // Search cars
    if (type === 'all' || type === 'cars') {
      results.cars = await prisma.car.findMany({
        where: {
          isPublic: true,
          OR: [
            { nickname: { contains: query, mode: 'insensitive' } },
            { engine: { contains: query, mode: 'insensitive' } },
            {
              generation: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { model: { name: { contains: query, mode: 'insensitive' } } },
                  { model: { make: { name: { contains: query, mode: 'insensitive' } } } },
                ],
              },
            },
          ],
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
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          car: { isPublic: true },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
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
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[api.search.GET] failed', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
