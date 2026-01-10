'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Car,
  CalendarDays,
  Trophy,
  Users,
  Bookmark,
  Settings,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  Bell,
  Camera,
  Gamepad2
} from 'lucide-react'

interface FeedSidebarProps {
  locale: string
  user: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
  } | null
}

export default function FeedSidebar({ locale, user }: FeedSidebarProps) {
  const pathname = usePathname()

  const mainNavItems = [
    { href: `/${locale}/feed`, label: 'Feed', icon: Home },
    { href: `/${locale}/explore`, label: 'Explore', icon: Search },
    { href: `/${locale}/garage`, label: 'My Garage', icon: Car },
    { href: `/${locale}/spots`, label: 'Car Spotting', icon: Camera },
    { href: `/${locale}/groups`, label: 'Groups', icon: Users },
    { href: `/${locale}/simracing`, label: 'Sim Racing', icon: Gamepad2 },
    { href: `/${locale}/events`, label: 'Events', icon: CalendarDays },
    { href: `/${locale}/leaderboards`, label: 'Leaderboards', icon: Trophy },
  ]

  const discoverItems = [
    { href: `/${locale}/explore?tab=trending`, label: 'Trending', icon: TrendingUp },
    { href: `/${locale}/explore?tab=users`, label: 'Find People', icon: Users },
    { href: `/${locale}/cars`, label: 'Browse Cars', icon: Car },
  ]

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return pathname === href.split('?')[0]
    }
    return pathname === href
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-6">
        {/* User Profile Card */}
        {user && (
          <Link
            href={`/${locale}/u/${user.username}`}
            className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user.name || user.username}</p>
              <p className="text-sm text-zinc-500 truncate">@{user.username}</p>
            </div>
          </Link>
        )}

        {/* Main Navigation */}
        <nav className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick Actions */}
        {user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="p-2">
              <Link
                href={`/${locale}/garage/new`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium">Add Car</span>
              </Link>
              <Link
                href={`/${locale}/new`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">New Post</span>
              </Link>
              <Link
                href={`/${locale}/spots/new`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">New Spot</span>
              </Link>
            </div>
          </div>
        )}

        {/* Discover */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Discover</h3>
          </div>
          <div className="p-2">
            {discoverItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className="px-4 text-xs text-zinc-600 space-y-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href={`/${locale}/about`} className="hover:text-zinc-400">About</Link>
            <Link href={`/${locale}/terms`} className="hover:text-zinc-400">Terms</Link>
            <Link href={`/${locale}/privacy`} className="hover:text-zinc-400">Privacy</Link>
            <Link href={`/${locale}/contact`} className="hover:text-zinc-400">Contact</Link>
          </div>
          <p>&copy; 2025 MachineBio</p>
        </div>
      </div>
    </aside>
  )
}
