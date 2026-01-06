import { NextResponse } from 'next/server'
import { createLogoutCookie } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const cookie = createLogoutCookie()

  const res = NextResponse.json({ success: true }, { status: 200 })
  res.headers.set('Set-Cookie', cookie)
  res.headers.set('Cache-Control', 'no-store')

  return res
}

export async function GET() {
  const cookie = createLogoutCookie()

  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), { status: 303 })
  res.headers.set('Set-Cookie', cookie)
  res.headers.set('Cache-Control', 'no-store')

  return res
}
