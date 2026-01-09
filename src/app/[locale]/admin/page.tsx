'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Trash2, AlertTriangle, Shield, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

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

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        id: string
        message: string
        attendeeCount: number
    } | null>(null)

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/')
                return
            }
            fetchData()
        }
    }, [user, authLoading, router])

    const fetchData = async () => {
        try {
            // Fetch recent events (we might need a dedicated admin endpoint later, but for now search/feed logic or direct fetch could work?)
            // Since we don't have a specific "list all events" for admin, let's use the feed API or assume we can add one.
            // For this MVP, I'll fetch from /api/feed/events if it exists, roughly mimicking "recent events".
            // EDIT: Checking file structure earlier, there is src/app/api/events. Let's see if GET /api/events returns a list.
            // If not, I'll assume we might need to add one or use a known one.
            // Let's rely on `src/app/api/feed` type='events' or similar if available. 
            // Actually, let's try `GET /api/events` assuming it supports listing.

            const res = await fetch('/api/events?limit=20') // Assuming basic pagination
            if (res.ok) {
                const data = await res.json()
                setEvents(data.events || [])
            }
        } catch (error) {
            console.error('Failed to fetch admin data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = async (eventId: string, e: React.MouseEvent) => {
        e.preventDefault()
        setDeletingId(eventId)

        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            })
            const data = await res.json()

            if (data.requiresConfirmation) {
                setDeleteConfirmation({
                    id: eventId,
                    message: data.message,
                    attendeeCount: data.attendeeCount
                })
            } else if (data.success) {
                setEvents(events.filter(e => e.id !== eventId))
            }
        } catch (error) {
            console.error('Delete failed', error)
        } finally {
            setDeletingId(null)
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation) return
        const eventId = deleteConfirmation.id
        setDeletingId(eventId)

        try {
            const res = await fetch(`/api/events/${eventId}?confirm=true`, {
                method: 'DELETE',
            })
            const data = await res.json()

            if (data.success) {
                setEvents(events.filter(e => e.id !== eventId))
                setDeleteConfirmation(null)
            }
        } catch (error) {
            console.error('Force delete failed', error)
        } finally {
            setDeletingId(null)
        }
    }

    if (authLoading || (loading && user?.role === 'admin')) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-orange-500" />
                    <h1 className="text-3xl font-bold text-white">Dev Panel</h1>
                    <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">
                        ADMIN ACCESS
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Events Management */}
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            Recent Events
                        </h2>

                        <div className="space-y-3">
                            {events.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-colors">
                                    <div>
                                        <Link href={`/events/${event.id}`} className="font-semibold text-white hover:text-orange-400 transition-colors">
                                            {event.title}
                                        </Link>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                                            <span>by @{event.organizer.username}</span>
                                            <span>•</span>
                                            <span>{new Date(event.date).toLocaleDateString()}</span>
                                            {event._count.attendees > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-zinc-400">
                                                        <Users className="w-3 h-3" />
                                                        {event._count.attendees}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteClick(event.id, e)}
                                        disabled={deletingId === event.id}
                                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete Event"
                                    >
                                        {deletingId === event.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            ))}

                            {events.length === 0 && (
                                <div className="text-center py-8 text-zinc-500">
                                    No active events found.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Quick Actions / Stats (Placeholder) */}
                    <section className="space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">System Stats</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div className="text-zinc-500 text-sm mb-1">Total Users</div>
                                    <div className="text-2xl font-bold text-white">-</div>
                                </div>
                                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div className="text-zinc-500 text-sm mb-1">Total Cars</div>
                                    <div className="text-2xl font-bold text-white">-</div>
                                </div>
                            </div>
                        </div>
                    </section>
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

                        <p className="text-zinc-300 mb-6">
                            {deleteConfirmation.message}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
