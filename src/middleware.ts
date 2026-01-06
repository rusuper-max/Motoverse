import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, Locale } from './i18n/config'

function getLocale(request: NextRequest): Locale {
  // Check cookie first
  const cookieLocale = request.cookies.get('locale')?.value as Locale
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().split('-')[0])
      .find((lang) => locales.includes(lang as Locale)) as Locale | undefined

    if (preferredLocale) {
      return preferredLocale
    }
  }

  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Redirect to locale-prefixed path
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`

  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Skip internal paths and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
