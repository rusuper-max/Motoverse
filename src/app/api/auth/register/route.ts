import { NextResponse } from 'next/server'
import {
  createUser,
  signSession,
  isEmailAvailable,
  isUsernameAvailable,
  isValidEmail,
  isValidUsername,
  isValidPassword,
} from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RegisterBody {
  email: string
  username: string
  password: string
  name?: string
}

export async function POST(req: Request) {
  try {
    const body: RegisterBody = await req.json()
    const { email, username, password, name } = body

    // Validate required fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Email, username, and password are required' },
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

    // Validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'invalid_username', message: 'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'weak_password', message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email is available
    const emailAvailable = await isEmailAvailable(email)
    if (!emailAvailable) {
      return NextResponse.json(
        { error: 'email_taken', message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if username is available
    const usernameAvailable = await isUsernameAvailable(username)
    if (!usernameAvailable) {
      return NextResponse.json(
        { error: 'username_taken', message: 'This username is already taken' },
        { status: 409 }
      )
    }

    // Create user
    const user = await createUser({ email, username, password, name })

    // Sign session
    const cookie = await signSession(user)

    const res = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } },
      { status: 201 }
    )
    res.headers.set('Set-Cookie', cookie)
    res.headers.set('Cache-Control', 'no-store')

    return res
  } catch (error) {
    console.error('[auth.register] failed', error)
    return NextResponse.json(
      { error: 'registration_failed', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
