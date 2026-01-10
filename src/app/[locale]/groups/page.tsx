'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Users, Plus, Search, Lock, Globe, Loader2, Car, Gamepad2, Wrench, Flag } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Group {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  avatar: string | null
  privacy: string
  category: string | null
  memberCount: number
  postCount: number
  isMember: boolean
  userRole: string | null
  _count: { members: number; posts: number }
}

const CATEGORIES = [
  { value: '', label: 'All Groups', icon: Users },
  { value: 'cars', label: 'Cars', icon: Car },
  { value: 'simracing', label: 'Sim Racing', icon: Gamepad2 },
  { value: 'tuning', label: 'Tuning', icon: Wrench },
  { value: 'meets', label: 'Meets & Events', icon: Flag },
]

export default function GroupsPage() {
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const { authenticated, user } = useAuth()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showMyGroups, setShowMyGroups] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      if (searchQuery) params.set('search', searchQuery)
      if (showMyGroups && authenticated) params.set('my', 'true')

      const res = await fetch(`/api/groups?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, showMyGroups, authenticated])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchGroups()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-heading flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              Groups
            </h1>
            <p className="text-zinc-400 mt-1">Join communities of car enthusiasts</p>
          </div>
          {authenticated && (
            <Link
              href={`/${locale}/groups/create`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* My Groups Toggle */}
            {authenticated && (
              <button
                onClick={() => setShowMyGroups(!showMyGroups)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showMyGroups
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                My Groups
              </button>
            )}
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No groups found</h2>
            <p className="text-zinc-400">
              {showMyGroups
                ? "You haven't joined any groups yet"
                : 'Be the first to create a group!'}
            </p>
            {authenticated && !showMyGroups && (
              <Link
                href={`/${locale}/groups/create`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Group
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/${locale}/groups/${group.slug}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group"
              >
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-br from-orange-600/20 to-zinc-800 relative">
                  {group.coverImage && (
                    <img
                      src={group.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    {group.privacy === 'private' ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-zinc-300">
                        <Lock className="w-3 h-3" />
                        Private
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-zinc-300">
                        <Globe className="w-3 h-3" />
                        Public
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 -mt-8 relative z-10">
                      {group.avatar ? (
                        <img src={group.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">
                        {group.name}
                      </h3>
                      {group.category && (
                        <span className="text-xs text-orange-400 capitalize">{group.category}</span>
                      )}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-zinc-400 mt-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
                    <div className="text-sm">
                      <span className="text-white font-medium">{group.memberCount}</span>
                      <span className="text-zinc-500 ml-1">members</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white font-medium">{group.postCount}</span>
                      <span className="text-zinc-500 ml-1">posts</span>
                    </div>
                    {group.isMember && (
                      <span className="ml-auto text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                        Joined
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
