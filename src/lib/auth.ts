import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'
const SESSION_COOKIE_NAME = 'motoverse_session'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Secret key for JWT signing
const secretKey = new TextEncoder().encode(SESSION_SECRET)

// Session user type
export interface SessionUser {
  id: string
  email: string
  username: string
  name?: string | null
  avatar?: string | null
}

// Cookie configuration
export const COOKIE_BASE = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: IS_PRODUCTION,
  path: '/' as const,
}

// Password hashing
const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Read cookie from header string
function readCookieFromHeader(header: string | null | undefined, name: string): string | null {
  if (!header) return null
  const parts = header.split(/; */)
  for (const p of parts) {
    const i = p.indexOf('=')
    if (i === -1) continue
    const k = p.slice(0, i).trim()
    if (k === name) return decodeURIComponent(p.slice(i + 1))
  }
  return null
}

// Verify JWT token and extract user
async function userFromToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey)
    const u = payload.user as SessionUser | undefined
    if (!u?.id || !u?.email) return null
    return u
  } catch {
    return null
  }
}

// Sign a new session and return the Set-Cookie header value
export async function signSession(user: SessionUser, days = 30): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey)

  const attrs: string[] = []
  attrs.push(`${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`)
  attrs.push(`Path=${COOKIE_BASE.path}`)
  if (COOKIE_BASE.httpOnly) attrs.push('HttpOnly')
  attrs.push(`SameSite=${COOKIE_BASE.sameSite.charAt(0).toUpperCase() + COOKIE_BASE.sameSite.slice(1)}`)
  if (COOKIE_BASE.secure) attrs.push('Secure')
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60))
  attrs.push(`Max-Age=${maxAge}`)

  return attrs.join('; ')
}

// Get session user from request
// Get session user from request
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) return null

    // Fetch public profile
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true
      }
    })

    if (!user) return null

    return user
  } catch (error) {
    console.error('getSessionUser failed', error)
    return null
  }
}

// Get current user from session (for use in components/pages)
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser()
}

// Create logout cookie (expires immediately)
export function createLogoutCookie(): string {
  const attrs: string[] = []
  attrs.push(`${SESSION_COOKIE_NAME}=`)
  attrs.push('Path=/')
  attrs.push('HttpOnly')
  attrs.push('SameSite=Lax')
  if (IS_PRODUCTION) attrs.push('Secure')
  attrs.push('Max-Age=0')
  return attrs.join('; ')
}

// User lookup helpers
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      cars: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })
}

// Check if username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  })
  return !existing
}

// Check if email is available
export async function isEmailAvailable(email: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })
  return !existing
}

// Create new user
export async function createUser(data: {
  email: string
  username: string
  password: string
  name?: string
}): Promise<SessionUser> {
  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash,
      name: data.name || null,
    },
  })

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
  }
}

// Authenticate user with email and password
export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
  }
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
  // Username: 3-20 chars, alphanumeric and underscores only, must start with letter
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
  return usernameRegex.test(username)
}

export function isValidPassword(password: string): boolean {
  // Password: minimum 8 characters
  return password.length >= 8
}
