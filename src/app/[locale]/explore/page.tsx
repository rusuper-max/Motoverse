'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Search, Car, FileText, Heart, MessageCircle, Calendar, User, Loader2, Star, Activity, Zap } from 'lucide-react'

interface FeedItem {
  id: string
  type: 'post' | 'car' | 'rating' | 'car_comment'
  createdAt: string
  activityText?: string
  data: {
    id: string
    title?: string
    content?: string
    category?: string
    images?: string | string[]
    thumbnail?: string
    nickname?: string
    year?: number
    image?: string
    engine?: string
    horsepower?: number
    isLiked?: boolean
    rating?: number
    comment?: string
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
    car?: {
      id: string
      nickname: string | null
      year: number
      image?: string | null
      thumbnail?: string | null
      owner?: {
        id: string
        username: string
      }
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
    _count?: {
      likes?: number
      comments?: number
      posts?: number
      ratings?: number
    }
  }
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}

function ExploreContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params?.locale as string || 'en'

  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'activity' | 'all' | 'posts' | 'cars'>('activity')
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize search from URL query parameter
  useEffect(() => {
    const q = searchParams?.get('q')
    if (q) {
      setSearchQuery(q)
    }
  }, [searchParams])

  useEffect(() => {
    fetchFeed()
  }, [filter, searchQuery])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        type: filter,
        limit: '30',
      })
      if (searchQuery.trim()) {
        queryParams.set('q', searchQuery.trim())
      }
      const res = await fetch(`/api/feed?${queryParams.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCarName = (item: FeedItem) => {
    if (item.type === 'car' && item.data.generation) {
      const gen = item.data.generation
      return `${item.data.year} ${gen.model.make.name} ${gen.model.name}`
    }
    if (item.type === 'post' && item.data.car?.generation) {
      const gen = item.data.car.generation
      return `${item.data.car.year} ${gen.model.make.name} ${gen.model.name}`
    }
    return item.data.nickname || 'Unknown Car'
  }

  const getImageUrl = (item: FeedItem) => {
    if (item.type === 'post') {
      if (item.data.thumbnail) return item.data.thumbnail
      if (item.data.images && typeof item.data.images === 'string') {
        try {
          const imgs = JSON.parse(item.data.images)
          if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
        } catch {}
      }
    }
    // For cars - check thumbnail, image, or first in images array
    if (item.data.thumbnail) return item.data.thumbnail
    if (item.data.image) return item.data.image
    if (item.data.images && Array.isArray(item.data.images) && item.data.images.length > 0) {
      return item.data.images[0]
    }
    return null
  }

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const carName = getCarName(item).toLowerCase()
    const title = item.data.title?.toLowerCase() || ''
    const owner = item.type === 'car'
      ? item.data.owner?.username?.toLowerCase() || ''
      : item.data.author?.username?.toLowerCase() || ''
    return carName.includes(query) || title.includes(query) || owner.includes(query)
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
          <p className="text-zinc-400">Discover cars and builds from the community</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search cars, posts, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {([
              { key: 'activity', label: 'Activity', icon: Zap },
              { key: 'all', label: 'All', icon: Activity },
              { key: 'cars', label: 'Cars', icon: Car },
              { key: 'posts', label: 'Posts', icon: FileText },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filter === f.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <f.icon className="w-4 h-4" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-zinc-400">
              {searchQuery ? 'Try a different search term' : 'Be the first to share your car!'}
            </p>
          </div>
        )}

        {/* Feed Grid or Activity List */}
        {!loading && filteredItems.length > 0 && (
          filter === 'activity' ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {filteredItems.map((item) => (
                <ActivityItem key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <FeedCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function FeedCard({ item, locale }: { item: FeedItem; locale: string }) {
  const isPost = item.type === 'post'
  const user = isPost ? item.data.author : item.data.owner

  const getCarName = () => {
    if (item.type === 'car' && item.data.generation) {
      const gen = item.data.generation
      return `${item.data.year} ${gen.model.make.name} ${gen.model.name}`
    }
    if (item.type === 'post' && item.data.car?.generation) {
      const gen = item.data.car.generation
      return `${item.data.car.year} ${gen.model.make.name} ${gen.model.name}`
    }
    return item.data.nickname || 'Car'
  }

  const getImageUrl = () => {
    // For posts - check thumbnail first, then parse images JSON
    if (item.type === 'post') {
      if (item.data.thumbnail) return item.data.thumbnail
      if (item.data.images) {
        // Post.images is a JSON string
        if (typeof item.data.images === 'string') {
          try {
            const imgs = JSON.parse(item.data.images)
            if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
          } catch {}
        }
      }
      // Fallback to car's image if post has no images
      if (item.data.car?.image) return item.data.car.image
      if (item.data.car?.thumbnail) return item.data.car.thumbnail
      return null
    }

    // For cars - check thumbnail, image, or first in images array
    if (item.data.thumbnail) return item.data.thumbnail
    if (item.data.image) return item.data.image
    if (item.data.images && Array.isArray(item.data.images) && item.data.images.length > 0) {
      return item.data.images[0]
    }
    return null
  }

  const imageUrl = getImageUrl()
  const carLink = item.type === 'car'
    ? `/${locale}/garage/${item.data.id}`
    : item.data.car ? `/${locale}/garage/${item.data.car.id}` : null
  const postLink = item.type === 'post' ? `/${locale}/posts/${item.data.id}` : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Image */}
      <Link href={isPost ? postLink! : carLink!}>
        <div className="relative aspect-video bg-zinc-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={getCarName()}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Car className="w-12 h-12 text-zinc-700" />
            </div>
          )}
          {/* Type Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
            isPost ? 'bg-blue-500/80 text-white' : 'bg-orange-500/80 text-white'
          }`}>
            {isPost ? <FileText className="w-3 h-3 inline mr-1" /> : <Car className="w-3 h-3 inline mr-1" />}
            {isPost ? 'Post' : 'Car'}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link href={isPost ? postLink! : carLink!}>
          <h3 className="font-semibold text-white hover:text-orange-400 transition-colors line-clamp-1">
            {isPost ? item.data.title : (item.data.nickname || getCarName())}
          </h3>
        </Link>

        {/* Car info for posts */}
        {isPost && (
          <p className="text-sm text-zinc-500 mt-1">
            {getCarName()}
          </p>
        )}

        {/* Car specs */}
        {!isPost && item.data.engine && (
          <p className="text-sm text-zinc-500 mt-1">
            {item.data.engine} {item.data.horsepower && `• ${item.data.horsepower} HP`}
          </p>
        )}

        {/* Owner/Author */}
        {user && (
          <Link href={`/${locale}/u/${user.username}`} className="flex items-center gap-2 mt-3 group">
            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-3 h-3 text-zinc-500" />
                </div>
              )}
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
              @{user.username}
            </span>
          </Link>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
          {isPost && (
            <>
              <span className="flex items-center gap-1">
                <Heart className={`w-4 h-4 ${item.data.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {item.data._count?.likes || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {item.data._count?.comments || 0}
              </span>
            </>
          )}
          {!isPost && (
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {item.data._count?.posts || 0} posts
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-4 h-4" />
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ item, locale }: { item: FeedItem; locale: string }) {
  const getUser = () => {
    if (item.type === 'post') return item.data.author
    if (item.type === 'car') return item.data.owner
    if (item.type === 'rating') return item.data.user
    if (item.type === 'car_comment') return item.data.author
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
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = () => {
    switch (item.type) {
      case 'post': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'car': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'rating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'car_comment': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
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
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{item.data.content.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
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
