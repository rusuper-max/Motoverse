'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search, Car, FileText, Heart, MessageCircle, Calendar, User, Loader2 } from 'lucide-react'

interface FeedItem {
  id: string
  type: 'post' | 'car'
  createdAt: string
  data: {
    id: string
    title?: string
    content?: string
    category?: string
    images?: string | string[] // Post has JSON string, Car has array
    thumbnail?: string
    nickname?: string
    year?: number
    image?: string
    engine?: string
    horsepower?: number
    isLiked?: boolean
    author?: {
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
  const params = useParams()
  const locale = params?.locale as string || 'en'

  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'posts' | 'cars'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFeed()
  }, [filter])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?type=${filter}&limit=30`)
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
            {(['all', 'cars', 'posts'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'cars' ? 'Cars' : 'Posts'}
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

        {/* Feed Grid */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <FeedCard key={`${item.type}-${item.id}`} item={item} locale={locale} />
            ))}
          </div>
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
