import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const user = await getSessionUser(req)

  return NextResponse.json(
    {
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        unitSystem: user.unitSystem,
      } : null,
    },
    { headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } }
  )
}
