'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Car, FileText, MessageCircle, Star, Loader2, Users, Zap, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import FeedSidebar from '@/components/feed/FeedSidebar'

interface FeedItem {
  id: string
  type: 'post' | 'car' | 'rating' | 'car_comment' | 'photo'
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

export default function FeedPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale as string || 'en'
  const { user, loading: authLoading, authenticated } = useAuth()

  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace(`/${locale}`)
    }
  }, [authLoading, authenticated, router, locale])

  useEffect(() => {
    if (!authLoading && user) {
      fetchFeed()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feed/following?limit=30')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <FeedSidebar locale={locale} user={user} />

          {/* Main Feed */}
          <main className="flex-1 max-w-2xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-white">Your Feed</h1>
              </div>
              <p className="text-zinc-400">Updates from people and cars you follow</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
              <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
                <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
                <p className="text-zinc-400 mb-6">
                  Follow some users or cars to see their activity here!
                </p>
                <Link
                  href={`/${locale}/explore`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Explore Community
                </Link>
              </div>
            )}

            {/* Feed Items */}
            {!loading && items.length > 0 && (
              <div className="space-y-4">
                {items.map((item) => (
                  <FeedActivityItem key={item.id} item={item} locale={locale} formatTimeAgo={formatTimeAgo} />
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar - Suggestions */}
          <aside className="w-80 shrink-0 hidden xl:block">
            <div className="sticky top-20 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4">Suggested for you</h3>
                <p className="text-sm text-zinc-500">
                  Follow more people and cars to get personalized suggestions here.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function FeedActivityItem({
  item,
  locale,
  formatTimeAgo,
}: {
  item: FeedItem
  locale: string
  formatTimeAgo: (date: string) => string
}) {
  const getUser = () => {
    if (item.type === 'post') return item.data.author
    if (item.type === 'car') return item.data.owner
    if (item.type === 'rating') return item.data.user
    if (item.type === 'car_comment') return item.data.author
    if (item.type === 'photo') return item.data.uploader
    return null
  }

  const getCarLink = () => {
    if (item.type === 'car') return `/${locale}/garage/${item.data.id}`
    if (item.data.car) return `/${locale}/garage/${item.data.car.id}`
    return null
  }

  const getImageUrl = () => {
    if (item.data.car?.thumbnail) return item.data.car.thumbnail
    if (item.data.car?.image) return item.data.car.image
    if (item.data.thumbnail) return item.data.thumbnail
    if (item.data.image) return item.data.image
    return null
  }

  const getActivityIcon = () => {
    switch (item.type) {
      case 'post': return <FileText className="w-4 h-4" />
      case 'car': return <Car className="w-4 h-4" />
      case 'rating': return <Star className="w-4 h-4" />
      case 'car_comment': return <MessageCircle className="w-4 h-4" />
      case 'photo': return <Camera className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getActivityColor = () => {
    switch (item.type) {
      case 'post': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'car': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'rating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'car_comment': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'photo': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const user = getUser()
  const carLink = getCarLink()
  const imageUrl = getImageUrl()

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex gap-4">
        {/* User Avatar */}
        {user && (
          <Link href={`/${locale}/u/${user.username}`} className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                  <span className="text-sm font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          {/* Activity Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Link
                href={`/${locale}/u/${user.username}`}
                className="font-semibold text-white hover:text-orange-400 transition-colors"
              >
                {user.name || user.username}
              </Link>
            )}
            <span className="text-zinc-400">{item.activityText}</span>
            <span className="text-zinc-600 text-sm">{formatTimeAgo(item.createdAt)}</span>
          </div>

          {/* Activity Type Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border mt-2 ${getActivityColor()}`}>
            {getActivityIcon()}
            <span className="capitalize">{item.type.replace('_', ' ')}</span>
          </div>

          {/* Extra Content based on type */}
          {item.type === 'post' && item.data.title && (
            <Link
              href={`/${locale}/posts/${item.data.id}`}
              className="block mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-orange-500/50 transition-colors"
            >
              <h4 className="font-medium text-white line-clamp-1">{item.data.title}</h4>
              {item.data.content && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                  {item.data.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
              )}
            </Link>
          )}

          {item.type === 'rating' && (
            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <div className="flex items-center gap-1">
                {[...Array(10)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (item.data.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`}
                  />
                ))}
                <span className="ml-2 text-white font-medium">{item.data.rating}/10</span>
              </div>
              {item.data.comment && (
                <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{item.data.comment}</p>
              )}
            </div>
          )}

          {item.type === 'car_comment' && item.data.content && (
            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <p className="text-sm text-zinc-300 line-clamp-3">{item.data.content}</p>
            </div>
          )}

          {item.type === 'photo' && (
            <Link
              href={carLink || '#'}
              className="block mt-3 overflow-hidden rounded-lg border border-zinc-700/50 hover:border-purple-500/50 transition-colors"
            >
              <div className="aspect-video bg-zinc-800 relative">
                <img
                  src={item.data.thumbnail || item.data.url}
                  alt={item.data.caption || ''}
                  className="w-full h-full object-cover"
                />
                {/* Rating badge */}
                {item.data.avgRating !== null && item.data.avgRating !== undefined && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-sm font-medium">
                    <span className={item.data.avgRating >= 8000 ? 'text-red-400' : 'text-orange-400'}>
                      {(item.data.avgRating / 1000).toFixed(1)}k RPM
                    </span>
                    <span className="text-zinc-500 text-xs ml-1">({item.data.ratingCount})</span>
                  </div>
                )}
              </div>
              {item.data.caption && (
                <div className="p-3 bg-zinc-800/50">
                  <p className="text-sm text-zinc-300 line-clamp-2">{item.data.caption}</p>
                </div>
              )}
            </Link>
          )}
        </div>

        {/* Car Image (if available) */}
        {imageUrl && carLink && (
          <Link href={carLink} className="shrink-0 hidden sm:block">
            <div className="w-20 h-20 rounded-lg bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
