import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LoginBody {
  identifier: string // Can be email or username
  password: string
}

export async function POST(req: Request) {
  try {
    const body: LoginBody = await req.json()
    // Support both 'email' (legacy) and 'identifier' (new) field names
    const identifier = body.identifier || (body as unknown as { email: string }).email
    const { password } = body

    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Determine if input is email or username
    let email = identifier
    if (!isValidEmail(identifier)) {
      // Not an email, treat as username and look up email
      const user = await prisma.user.findUnique({
        where: { username: identifier.toLowerCase() },
        select: { email: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'invalid_credentials', message: 'Invalid username/email or password' },
          { status: 401 }
        )
      }
      email = user.email
    }

    const supabase = await createClient()

    // Sign in with Supabase using the resolved email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get public user data
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, email: true, username: true, name: true }
    })

    if (!user) {
      // Drift detected: Auth exists but Public profile missing
      return NextResponse.json(
        { error: 'profile_missing', message: 'User profile not found. Please contact support.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    )
  } catch (error) {
    console.error('[auth.login] failed', error)
    return NextResponse.json(
      { error: 'login_failed', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
