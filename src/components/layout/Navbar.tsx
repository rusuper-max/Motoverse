'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Home, Search, PlusCircle, User, Menu, X, LayoutGrid, Globe, LogOut, CalendarDays, Trophy, Bell, Zap, MessageCircle, Camera, Shield } from 'lucide-react'
import Button from '../ui/Button'
import { Locale, locales, localeNames, localeFlags } from '@/i18n/config'
import { Dictionary } from '@/i18n'
import { useAuth } from '@/hooks/useAuth'

interface GarageCar {
  id: string
  nickname: string | null
  make: string | null
  model: string | null
  generation?: {
    model: {
      name: string
      make: { name: string }
    }
  } | null
}

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
  postId?: string
  carId?: string
  actor?: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

interface NavbarProps {
  locale: Locale
  dict: Dictionary
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [garageCars, setGarageCars] = useState<GarageCar[]>([])
  const { authenticated, user, loading, logout } = useAuth()

  const langMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!authenticated) return
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [authenticated])

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (authenticated) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [authenticated, fetchNotifications])

  // Fetch user's garage cars for quick access
  const fetchGarageCars = useCallback(async () => {
    if (!authenticated) return
    try {
      const res = await fetch('/api/cars?limit=3')
      if (res.ok) {
        const data = await res.json()
        setGarageCars(data.cars || [])
      }
    } catch (e) {
      console.error('Failed to fetch garage cars', e)
    }
  }, [authenticated])

  useEffect(() => {
    if (authenticated) {
      fetchGarageCars()
    }
  }, [authenticated, fetchGarageCars])

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(localePath(`/explore?q=${encodeURIComponent(searchQuery.trim())}`))
      setSearchQuery('')
      searchInputRef.current?.blur()
    }
  }

  // Mark notifications as read when opening the menu
  const handleNotifMenuOpen = async () => {
    setIsNotifMenuOpen(!isNotifMenuOpen)
    if (!isNotifMenuOpen && unreadCount > 0) {
      // Mark all as read
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAllRead: true }),
        })
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      } catch (e) {
        console.error('Failed to mark notifications as read', e)
      }
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
            <span className="text-xl font-bold text-white">MachineBio</span>
          </Link>

          {/* Center Section - Search (authenticated) or Navigation (non-authenticated) */}
          {authenticated ? (
            /* Search Box for authenticated users */
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className={`relative flex items-center transition-all ${isSearchFocused ? 'ring-2 ring-orange-500/50' : ''} rounded-lg`}>
                  <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search cars, users, events..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:bg-zinc-800 focus:border-zinc-600 transition-colors"
                  />
                </div>
              </form>
            </div>
          ) : (
            /* Navigation for non-authenticated users */
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
              <Link
                href={localePath('/spots')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Spots</span>
              </Link>
            </div>
          )}

          {/* Right side - Quick Garage + Icons + Profile */}
          <div className="hidden md:flex items-center gap-2">
            {/* Quick Garage Access - only for authenticated users with cars */}
            {authenticated && garageCars.length > 0 && (
              <div className="flex items-center gap-1 mr-2 pr-3 border-r border-zinc-700/50">
                {garageCars.slice(0, 3).map((car, index) => (
                  <Link
                    key={car.id}
                    href={localePath(`/garage/${car.id}`)}
                    className="relative group"
                    title={car.nickname || `${car.generation?.model.make.name || car.make || ''} ${car.generation?.model.name || car.model || ''}`.trim()}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors border border-zinc-700/50 group-hover:border-orange-500/50">
                      <Car className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      {index + 1}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Chat Bubble - only for authenticated users */}
            {authenticated && (
              <Link
                href={localePath('/messages')}
                className="relative flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Messages"
              >
                <MessageCircle className="w-5 h-5" />
                {/* TODO: Add unread message count badge */}
              </Link>
            )}

            {/* Notification Bell - only show when authenticated */}
            {authenticated && (
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={handleNotifMenuOpen}
                  className="relative flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <Link
                            key={notif.id}
                            href={notif.carId ? localePath(`/cars/${notif.carId}`) : notif.postId ? localePath(`/posts/${notif.postId}`) : localePath(`/u/${notif.actor?.username || ''}`)}
                            onClick={() => setIsNotifMenuOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors ${!notif.read ? 'bg-zinc-800/50' : ''}`}
                          >
                            {notif.actor ? (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {notif.actor.username.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-5 h-5 text-zinc-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-300 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Switcher - compact for authenticated, full for non-authenticated */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Language"
              >
                <span className="text-base">{localeFlags[locale]}</span>
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

            {/* Auth Buttons / Profile */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : authenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
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
                    {user.role === 'admin' && (
                      <Link
                        href={localePath('/admin')}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
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
              <Link
                href={localePath('/spots')}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <Camera className="w-5 h-5" />
                <span>Spots</span>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-zinc-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
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
                    {user.role === 'admin' && (
                      <Link href={localePath('/admin')}>
                        <Button variant="outline" className="w-full text-orange-400 border-orange-500/50 hover:bg-orange-500/10">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
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
