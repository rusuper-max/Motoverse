import { NextResponse } from 'next/server'
import { authenticateUser, signSession, isValidEmail } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LoginBody {
  email: string
  password: string
}

export async function POST(req: Request) {
  try {
    const body: LoginBody = await req.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'invalid_email', message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await authenticateUser(email, password)
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Sign session
    const cookie = await signSession(user)

    const res = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } },
      { status: 200 }
    )
    res.headers.set('Set-Cookie', cookie)
    res.headers.set('Cache-Control', 'no-store')

    return res
  } catch (error) {
    console.error('[auth.login] failed', error)
    return NextResponse.json(
      { error: 'login_failed', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
