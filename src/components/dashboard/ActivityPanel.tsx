'use client'

import Link from 'next/link'
import { Car, FileText, MessageCircle, Star, Camera, Zap, Clock, Users, Gamepad2 } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'post' | 'car' | 'rating' | 'car_comment' | 'photo' | 'group' | 'laptime'
  createdAt: string
  activityText?: string
  data: {
    id: string
    title?: string
    content?: string
    thumbnail?: string
    image?: string
    url?: string
    caption?: string
    nickname?: string
    year?: number
    rating?: number
    comment?: string
    avgRating?: number | null
    ratingCount?: number
    commentCount?: number
    author?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    user?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    owner?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    uploader?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    car?: {
      id: string
      nickname: string | null
      year: number
      image?: string | null
      thumbnail?: string | null
      generation?: {
        name: string
        model: {
          name: string
          make: { name: string }
        }
      }
    }
    generation?: {
      name: string
      model: {
        name: string
        make: { name: string }
      }
    }
  }
}

interface ActivityPanelProps {
  items: ActivityItem[]
  locale: string
  loading?: boolean
  emptyMessage?: string
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString()
}

export default function ActivityPanel({
  items,
  locale,
  loading = false,
  emptyMessage = 'No recent activity',
}: ActivityPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 p-3 bg-zinc-900/50 rounded-lg">
            <div className="w-10 h-10 bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} locale={locale} />
      ))}
    </div>
  )
}

function ActivityItem({ item, locale }: { item: ActivityItem; locale: string }) {
  const getUser = () => {
    if (item.type === 'post') return item.data.author
    if (item.type === 'car') return item.data.owner
    if (item.type === 'rating') return item.data.user
    if (item.type === 'car_comment') return item.data.author
    if (item.type === 'photo') return item.data.uploader
    return null
  }

  const getActivityConfig = () => {
    switch (item.type) {
      case 'post':
        return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-l-blue-500' }
      case 'car':
        return { icon: Car, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-l-orange-500' }
      case 'rating':
        return { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-l-yellow-500' }
      case 'car_comment':
        return { icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-l-green-500' }
      case 'photo':
        return { icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-l-purple-500' }
      case 'group':
        return { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-l-cyan-500' }
      case 'laptime':
        return { icon: Gamepad2, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-l-pink-500' }
      default:
        return { icon: Zap, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-l-zinc-500' }
    }
  }

  const user = getUser()
  const config = getActivityConfig()
  const Icon = config.icon

  const getLink = () => {
    switch (item.type) {
      case 'post':
        return `/${locale}/posts/${item.data.id}`
      case 'car':
        return `/${locale}/garage/${item.data.id}`
      case 'photo':
      case 'rating':
      case 'car_comment':
        return item.data.car ? `/${locale}/garage/${item.data.car.id}` : '#'
      default:
        return '#'
    }
  }

  return (
    <Link
      href={getLink()}
      className={`flex items-center gap-3 p-3 rounded-lg border-l-2 ${config.border} ${config.bg} hover:bg-zinc-800/50 transition-colors group`}
    >
      {/* Activity Icon */}
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* User Avatar */}
      {user && (
        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {user && (
            <span className="font-medium text-white text-sm truncate">
              {user.name || user.username}
            </span>
          )}
          <span className="text-zinc-500 text-xs truncate">{item.activityText}</span>
        </div>
        {item.data.title && (
          <p className="text-xs text-zinc-400 truncate mt-0.5">{item.data.title}</p>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-zinc-600 text-xs shrink-0">
        <Clock className="w-3 h-3" />
        {formatTimeAgo(item.createdAt)}
      </div>

      {/* Thumbnail */}
      {(item.data.thumbnail || item.data.car?.thumbnail) && (
        <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0 hidden sm:block">
          <img
            src={item.data.thumbnail || item.data.car?.thumbnail || ''}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </Link>
  )
}
