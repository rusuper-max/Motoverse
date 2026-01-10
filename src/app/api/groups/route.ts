import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET /api/groups - List groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const myGroups = searchParams.get('my') === 'true'

    const user = await getSessionUser()

    const where: any = {
      privacy: { not: 'secret' }, // Don't show secret groups in public list
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // If user wants only their groups
    if (myGroups && user) {
      where.members = {
        some: { userId: user.id },
      }
      delete where.privacy // Show all groups user is member of
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          members: {
            where: user ? { userId: user.id } : { userId: 'none' },
            select: { role: true },
          },
          _count: {
            select: { members: true, posts: true },
          },
        },
        orderBy: { memberCount: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.group.count({ where }),
    ])

    const groupsWithMembership = groups.map((group) => ({
      ...group,
      isMember: group.members.length > 0,
      userRole: group.members[0]?.role || null,
      members: undefined,
    }))

    return NextResponse.json({
      groups: groupsWithMembership,
      total,
      hasMore: offset + groups.length < total,
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, privacy, coverImage, avatar } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Group name must be at least 3 characters' }, { status: 400 })
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug exists and add number if needed
    let slug = baseSlug
    let counter = 1
    while (await prisma.group.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        category: category || null,
        privacy: privacy || 'public',
        coverImage: coverImage || null,
        avatar: avatar || null,
        memberCount: 1,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
