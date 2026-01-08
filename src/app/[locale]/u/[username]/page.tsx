'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Car, FileText, MapPin, Calendar, Users, Heart, MessageCircle, User as UserIcon, Loader2 } from 'lucide-react'
import FollowButton from '@/components/FollowButton'

interface UserProfile {
  id: string
  username: string
  name: string | null
  bio: string | null
  avatar: string | null
  coverImage: string | null
  location: string | null
  createdAt: string
  isFollowing: boolean
  isOwnProfile: boolean
  cars: Array<{
    id: string
    nickname: string | null
    year: number
    image: string | null
    engine: string | null
    horsepower: number | null
    generation?: {
      name: string
      model: {
        name: string
        make: { name: string }
      }
    }
    _count: {
      posts: number
      ratings: number
    }
  }>
  posts: Array<{
    id: string
    title: string
    content: string
    thumbnail: string | null
    images: string | null
    category: string
    createdAt: string
    car?: {
      id: string
      nickname: string | null
      year: number
      generation?: {
        name: string
        model: {
          name: string
          make: { name: string }
        }
      }
    }
    _count: {
      likes: number
      comments: number
    }
  }>
  _count: {
    cars: number
    posts: number
    followers: number
    following: number
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params?.username as string
  const locale = params?.locale as string || 'en'

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cars' | 'posts'>('cars')

  useEffect(() => {
    if (username) {
      fetchUser()
    }
  }, [username])

  const fetchUser = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${username}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'User not found')
        return
      }

      setUser(data.user)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowChange = (isFollowing: boolean, newCount: number) => {
    if (user) {
      setUser({
        ...user,
        isFollowing,
        _count: { ...user._count, followers: newCount },
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
          <p className="text-zinc-400 mb-6">The user @{username} doesn&apos;t exist.</p>
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Explore Profiles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-orange-600/30 to-zinc-900">
        {user.coverImage && (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 pb-6 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-zinc-800 border-4 border-zinc-950 overflow-hidden">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                  <span className="text-4xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {user.name || user.username}
                  </h1>
                  <p className="text-zinc-400">@{user.username}</p>
                </div>

                {/* Follow Button */}
                {!user.isOwnProfile && (
                  <FollowButton
                    username={user.username}
                    initialIsFollowing={user.isFollowing}
                    initialFollowerCount={user._count.followers}
                    onFollowChange={handleFollowChange}
                  />
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-zinc-300 mt-3 max-w-2xl">{user.bio}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-zinc-500">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">{user._count.cars}</span>
                  <span className="text-sm text-zinc-500">Cars</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">{user._count.posts}</span>
                  <span className="text-sm text-zinc-500">Posts</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">{user._count.followers}</span>
                  <span className="text-sm text-zinc-500">Followers</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">{user._count.following}</span>
                  <span className="text-sm text-zinc-500">Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('cars')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'cars'
                ? 'text-orange-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Cars ({user.cars.length})
            </span>
            {activeTab === 'cars' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'posts'
                ? 'text-orange-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts ({user.posts.length})
            </span>
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="py-6">
          {activeTab === 'cars' && (
            <>
              {user.cars.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">No public cars yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.cars.map((car) => (
                    <CarCard key={car.id} car={car} locale={locale} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <>
              {user.posts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">No posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.posts.map((post) => (
                    <PostCard key={post.id} post={post} locale={locale} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CarCard({ car, locale }: { car: UserProfile['cars'][0]; locale: string }) {
  const getCarName = () => {
    if (car.generation) {
      return `${car.year} ${car.generation.model.make.name} ${car.generation.model.name}`
    }
    return car.nickname || 'Car'
  }

  return (
    <Link href={`/${locale}/garage/${car.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group">
        <div className="relative aspect-video bg-zinc-800">
          {car.image ? (
            <Image
              src={car.image}
              alt={getCarName()}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Car className="w-12 h-12 text-zinc-700" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
            {car.nickname || getCarName()}
          </h3>
          {car.nickname && (
            <p className="text-sm text-zinc-500">{getCarName()}</p>
          )}
          {car.engine && (
            <p className="text-sm text-zinc-500 mt-1">
              {car.engine} {car.horsepower && `• ${car.horsepower} HP`}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-sm text-zinc-500">
            <span>{car._count.posts} posts</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PostCard({ post, locale }: { post: UserProfile['posts'][0]; locale: string }) {
  const getCarName = () => {
    if (post.car?.generation) {
      return `${post.car.year} ${post.car.generation.model.make.name} ${post.car.generation.model.name}`
    }
    return post.car?.nickname || ''
  }

  const getImageUrl = () => {
    if (post.thumbnail) return post.thumbnail
    if (post.images) {
      try {
        const imgs = JSON.parse(post.images)
        if (imgs.length > 0) return imgs[0]
      } catch {}
    }
    return null
  }

  const imageUrl = getImageUrl()

  return (
    <Link href={`/${locale}/posts/${post.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors flex">
        {imageUrl && (
          <div className="relative w-32 sm:w-48 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4 flex-1">
          <h3 className="font-semibold text-white hover:text-orange-400 transition-colors line-clamp-1">
            {post.title}
          </h3>
          {post.car && (
            <p className="text-sm text-zinc-500 mt-1">{getCarName()}</p>
          )}
          <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post._count.comments}
            </span>
            <span className="ml-auto">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
