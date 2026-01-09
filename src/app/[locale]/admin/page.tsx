'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Users,
  Car,
  FileText,
  Camera,
  BadgeCheck,
  Crown,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserCog,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface UserData {
  id: string
  username: string
  name: string | null
  email: string
  avatar: string | null
  role: string
  isVerified: boolean
  profileCompleted: boolean
  createdAt: string
  _count: {
    cars: number
    posts: number
    followers: number
  }
}

interface Event {
  id: string
  title: string
  date: string
  location: string
  organizer: {
    username: string
  }
  _count: {
    attendees: number
  }
}

interface Stats {
  users: number
  cars: number
  posts: number
  spots: number
  verified: number
}

export default function AdminPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const { user, authenticated, loading: authLoading } = useAuth()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string
    type: 'user' | 'event'
    message: string
  } | null>(null)

  // Check admin access - founders AND admins can access
  const isAdmin = user?.role === 'founder' || user?.role === 'admin'
  const isFounder = user?.role === 'founder'

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (verifiedFilter) params.set('verified', verifiedFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setUsersLoading(false)
    }
  }, [page, search, roleFilter, verifiedFilter])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?limit=10')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && authenticated && isAdmin) {
      Promise.all([fetchStats(), fetchEvents()]).then(() => setLoading(false))
    } else if (!authLoading && (!authenticated || !isAdmin)) {
      router.push(`/${locale}`)
    }
  }, [authLoading, authenticated, isAdmin, fetchStats, fetchEvents, router, locale])

  useEffect(() => {
    if (isAdmin && !loading) {
      fetchUsers()
    }
  }, [page, roleFilter, verifiedFilter, isAdmin, loading, fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleVerifyUser = async (userId: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: verified }),
      })
      if (res.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteConfirmation({
      id: userId,
      type: 'user',
      message: 'Are you sure you want to delete this user? This will remove all their data including cars, posts, and comments. This action cannot be undone.',
    })
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.requiresConfirmation) {
        setDeleteConfirmation({
          id: eventId,
          type: 'event',
          message: data.message,
        })
      } else if (data.success) {
        setEvents(events.filter(e => e.id !== eventId))
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return
    const { id, type } = deleteConfirmation
    setDeletingId(id)

    try {
      if (type === 'user') {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchUsers()
          fetchStats()
        }
      } else {
        const res = await fetch(`/api/events/${id}?confirm=true`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          setEvents(events.filter(e => e.id !== id))
        }
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeletingId(null)
      setDeleteConfirmation(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            Admin Panel
            {isFounder && (
              <span className="px-3 py-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex items-center gap-1.5 font-semibold">
                <Crown className="w-3.5 h-3.5" />
                GOD MODE
              </span>
            )}
          </h1>
          <p className="text-zinc-400 mt-1">
            {isFounder ? 'Full control over the platform' : 'Manage users and content'}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.users}</p>
                  <p className="text-sm text-zinc-500">Users</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Car className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.cars}</p>
                  <p className="text-sm text-zinc-500">Cars</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.posts}</p>
                  <p className="text-sm text-zinc-500">Posts</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Camera className="w-8 h-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.spots}</p>
                  <p className="text-sm text-zinc-500">Spots</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.verified}</p>
                  <p className="text-sm text-zinc-500">Verified</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users Management - Takes 2 columns */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                User Management
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-32 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
                  className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="founder">Founder</option>
                </select>

                {/* Verified Filter */}
                <select
                  value={verifiedFilter}
                  onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1) }}
                  className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="divide-y divide-zinc-800">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">No users found</div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {u.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/${locale}/u/${u.username}`}
                          className="font-medium text-white hover:text-orange-400 flex items-center gap-1"
                        >
                          {u.name || u.username}
                          {u.isVerified && <BadgeCheck className="w-4 h-4 text-orange-500" />}
                          {u.role === 'founder' && <Crown className="w-4 h-4 text-amber-500" />}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>@{u.username}</span>
                          <span>•</span>
                          <span>{u._count.cars} cars</span>
                          <span>•</span>
                          <span>{u._count.followers} followers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Role badge */}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        u.role === 'founder' ? 'bg-amber-500/20 text-amber-400' :
                        u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        u.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {u.role}
                      </span>

                      {/* Verify button */}
                      <button
                        onClick={() => handleVerifyUser(u.id, !u.isVerified)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isVerified
                            ? 'text-orange-400 bg-orange-500/20 hover:bg-orange-500/30'
                            : 'text-zinc-500 hover:bg-zinc-700 hover:text-white'
                        }`}
                        title={u.isVerified ? 'Remove verification' : 'Verify user'}
                      >
                        <BadgeCheck className="w-4 h-4" />
                      </button>

                      {/* Founder-only controls */}
                      {isFounder && u.role !== 'founder' && (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Mod</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Events Management - Takes 1 column */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Events
              </h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {events.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No events yet</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/30">
                    <div>
                      <Link
                        href={`/${locale}/events/${event.id}`}
                        className="font-medium text-white hover:text-orange-400 text-sm"
                      >
                        {event.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        <span>by @{event.organizer.username}</span>
                        <span>•</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deletingId === event.id}
                      className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === event.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-900/50 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-zinc-300 mb-6">{deleteConfirmation.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!deletingId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
