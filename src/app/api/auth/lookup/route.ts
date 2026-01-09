import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/auth/lookup?username=xxx - Look up email by username
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'missing_username' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: user.email })
  } catch (error) {
    console.error('[auth.lookup] failed', error)
    return NextResponse.json(
      { error: 'lookup_failed' },
      { status: 500 }
    )
  }
}
