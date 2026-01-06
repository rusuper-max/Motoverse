'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Car, Home, Search, PlusCircle, User, Menu, X, LayoutGrid, Globe, LogOut, CalendarDays, Trophy } from 'lucide-react'
import Button from '../ui/Button'
import { Locale, locales, localeNames, localeFlags } from '@/i18n/config'
import { Dictionary } from '@/i18n'
import { useAuth } from '@/hooks/useAuth'

interface NavbarProps {
  locale: Locale
  dict: Dictionary
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { authenticated, user, loading, logout } = useAuth()

  const t = dict.nav

  // Helper to create locale-prefixed links
  const localePath = (path: string) => `/${locale}${path}`

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={localePath('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Motoverse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <Link
              href={localePath('/')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>{t.feed}</span>
            </Link>
            <Link
              href={localePath('/explore')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{t.explore}</span>
            </Link>
            <Link
              href={localePath('/events')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Events</span>
            </Link>
            <Link
              href={localePath('/leaderboards')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>Ranks</span>
            </Link>
            {authenticated && (
              <>
                <div className="w-px h-5 bg-zinc-800 mx-1" />
                <Link
                  href={localePath('/garage')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <Car className="w-4 h-4" />
                  <span>{t.myGarage}</span>
                </Link>
                <Link
                  href={localePath('/new')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.newPost}</span>
                </Link>
              </>
            )}
          </div>

          {/* Right side - Lang + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{localeFlags[locale]}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}`}
                      onClick={() => setIsLangMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${loc === locale ? 'text-orange-400 bg-zinc-800/50' : 'text-zinc-300'
                        }`}
                    >
                      <span>{localeFlags[loc]}</span>
                      <span>{localeNames[loc]}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : authenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.username}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    <Link
                      href={localePath(`/u/${user.username}`)}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{t.profile}</span>
                    </Link>
                    <Link
                      href={localePath('/garage')}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Car className="w-4 h-4" />
                      <span>{t.myGarage}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={localePath('/login')}>
                  <Button variant="ghost" size="sm">
                    {t.signIn}
                  </Button>
                </Link>
                <Link href={localePath('/register')}>
                  <Button variant="primary" size="sm">
                    {t.getStarted}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            <div className="flex flex-col gap-2">
              <Link
                href={localePath('/')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <Home className="w-5 h-5" />
                <span>{t.feed}</span>
              </Link>
              <Link
                href={localePath('/cars')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <LayoutGrid className="w-5 h-5" />
                <span>{t.cars}</span>
              </Link>
              <Link
                href={localePath('/explore')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <Search className="w-5 h-5" />
                <span>{t.explore}</span>
              </Link>
              <Link
                href={localePath('/events')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <CalendarDays className="w-5 h-5" />
                <span>Events</span>
              </Link>
              <Link
                href={localePath('/leaderboards')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <Trophy className="w-5 h-5" />
                <span>Leaderboards</span>
              </Link>

              {/* Mobile Language Switcher */}
              <div className="px-4 py-2">
                <p className="text-xs text-zinc-500 mb-2">Language</p>
                <div className="flex flex-wrap gap-2">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}`}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${loc === locale
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                    >
                      {localeFlags[loc]} {localeNames[loc]}
                    </Link>
                  ))}
                </div>
              </div>

              {authenticated && user ? (
                <div className="mt-4 px-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-zinc-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={localePath('/garage')} className="flex-1">
                      <Button variant="outline" className="w-full">
                        {t.myGarage}
                      </Button>
                    </Link>
                    <Button variant="ghost" className="text-red-400" onClick={logout}>
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 px-4">
                  <Link href={localePath('/login')} className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t.signIn}
                    </Button>
                  </Link>
                  <Link href={localePath('/register')} className="flex-1">
                    <Button variant="primary" className="w-full">
                      {t.getStarted}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
