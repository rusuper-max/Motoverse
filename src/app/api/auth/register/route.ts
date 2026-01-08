import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
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
        { error: 'invalid_username', message: 'Username must be 3-20 characters, letter start, alphanumeric/underscores' },
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

    // Check if username is available (in our public table)
    const usernameAvailable = await isUsernameAvailable(username)
    if (!usernameAvailable) {
      return NextResponse.json(
        { error: 'username_taken', message: 'This username is already taken' },
        { status: 409 }
      )
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          name,
        },
      },
    })

    if (authError) {
      console.error('Supabase signUp error:', authError)
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'email_taken', message: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'registration_failed', message: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'registration_failed', message: 'No user returned from provider' },
        { status: 500 }
      )
    }

    // Create public user profile in Prisma
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id, // Sync IDs
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          name: name || null,
          // passwordHash is optional now
        }
      })

      return NextResponse.json(
        { success: true, user: { id: user.id, email: user.email, username: user.username, name: user.name } },
        { status: 201 }
      )
    } catch (dbError) {
      console.error('Failed to create public profile:', dbError)
      // Rollback? We can't easily delete from Auth here without admin key. 
      // But preventing login effectively "fails" it for current session.
      // User exists in Auth but not Public. This is a known drift issue.
      return NextResponse.json(
        { error: 'registration_failed', message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[auth.register] failed', error)
    return NextResponse.json(
      { error: 'registration_failed', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
