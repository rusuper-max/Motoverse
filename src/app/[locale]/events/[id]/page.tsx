'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, Car, Clock, UserPlus, Check, X, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface CarData {
    id: string
    year: number
    nickname: string | null
    generation?: {
        displayName: string | null
        model: {
            name: string
            make: { name: string }
        }
    }
}

interface Attendee {
    id: string
    status: string
    lookingForRide: boolean
    hasEmptySeat: boolean
    user: {
        id: string
        username: string
        name: string | null
        avatar: string | null
        location: string | null
    }
    car: CarData | null
}

interface Event {
    id: string
    title: string
    description: string | null
    type: string
    location: string
    address: string | null
    city: string | null
    date: string
    endDate: string | null
    coverImage: string | null
    maxAttendees: number | null
    organizer: {
        id: string
        username: string
        name: string | null
    }
    attendees: Attendee[]
}

export default function EventDetailPage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as Locale
    const eventId = params.id as string

    const { user, authenticated } = useAuth()
    const [event, setEvent] = useState<Event | null>(null)
    const [carMakeCounts, setCarMakeCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [userCars, setUserCars] = useState<CarData[]>([])
    const [selectedCarId, setSelectedCarId] = useState('')
    const [rsvpLoading, setRsvpLoading] = useState(false)
    const [showRsvpModal, setShowRsvpModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState<number | null>(null)

    useEffect(() => {
        fetchEvent()
    }, [eventId])

    useEffect(() => {
        if (authenticated) {
            fetchUserCars()
        }
    }, [authenticated])

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`)
            if (res.ok) {
                const data = await res.json()
                setEvent(data.event)
                setCarMakeCounts(data.carMakeCounts || {})
            } else {
                router.push(`/${locale}/events`)
            }
        } catch {
            router.push(`/${locale}/events`)
        } finally {
            setLoading(false)
        }
    }

    const fetchUserCars = async () => {
        try {
            const res = await fetch('/api/cars', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setUserCars(data.cars || [])
            }
        } catch {
            // ignore
        }
    }

    const handleRsvp = async () => {
        setRsvpLoading(true)
        try {
            const res = await fetch(`/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    carId: selectedCarId || null,
                    status: 'going',
                }),
            })
            if (res.ok) {
                fetchEvent()
                setShowRsvpModal(false)
            }
        } catch {
            // ignore
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleCancelRsvp = async () => {
        setRsvpLoading(true)
        try {
            await fetch(`/api/events/${eventId}/rsvp`, {
                method: 'DELETE',
                credentials: 'include',
            })
            fetchEvent()
        } catch {
            // ignore
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleDeleteEvent = async (confirm: boolean = false) => {
        setDeleteLoading(true)
        try {
            const url = confirm ? `/api/events/${eventId}?confirm=true` : `/api/events/${eventId}`
            const res = await fetch(url, {
                method: 'DELETE',
                credentials: 'include',
            })
            const data = await res.json()

            if (data.requiresConfirmation) {
                setDeleteConfirmCount(data.attendeeCount)
                return
            }

            if (data.deleted) {
                router.push(`/${locale}/events`)
            }
        } catch {
            // ignore
        } finally {
            setDeleteLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!event) return null

    const isOrganizer = user?.id === event.organizer.id
    const isPrivileged = user?.role === 'admin' || user?.role === 'founder'
    const canDelete = isOrganizer || isPrivileged
    const userRsvp = event.attendees.find(a => a.user.id === user?.id)
    const isGoing = !!userRsvp

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back */}
                <Link
                    href={`/${locale}/events`}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Events
                </Link>

                {/* Hero */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
                    {event.coverImage ? (
                        <div className="aspect-[2.5/1] bg-zinc-800">
                            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-[2.5/1] bg-gradient-to-br from-orange-900/50 to-amber-900/50 flex items-center justify-center">
                            <Calendar className="w-24 h-24 text-orange-500/30" />
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-500/20 text-orange-300 capitalize">
                                    {event.type}
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">{event.title}</h1>
                            </div>
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center gap-3 text-zinc-300">
                                <Clock className="w-5 h-5 text-orange-400" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <MapPin className="w-5 h-5 text-orange-400" />
                                <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <Users className="w-5 h-5 text-orange-400" />
                                <span>
                                    {event.attendees.length} going
                                    {event.maxAttendees && ` / ${event.maxAttendees} max`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <UserPlus className="w-5 h-5 text-orange-400" />
                                <span>Organized by {event.organizer.name || event.organizer.username}</span>
                            </div>
                        </div>

                        {event.description && (
                            <p className="text-zinc-400 mt-4">{event.description}</p>
                        )}

                        {/* RSVP Button */}
                        <div className="mt-6 pt-6 border-t border-zinc-800">
                            {authenticated ? (
                                isGoing ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <Check className="w-5 h-5" />
                                            You&apos;re going!
                                            {userRsvp?.car && (
                                                <span className="text-zinc-400">
                                                    with your {userRsvp.car.generation?.model.make.name} {userRsvp.car.generation?.model.name}
                                                </span>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={handleCancelRsvp} disabled={rsvpLoading}>
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={() => setShowRsvpModal(true)}>
                                        <Car className="w-5 h-5 mr-2" />
                                        I&apos;m Going
                                    </Button>
                                )
                            ) : (
                                <Link href={`/${locale}/login`}>
                                    <Button>Log in to RSVP</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Who's Going - Grouped by Make */}
                {Object.keys(carMakeCounts).length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Cars Going</h2>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(carMakeCounts)
                                .sort(([, a], [, b]) => b - a)
                                .map(([make, count]) => (
                                    <div
                                        key={make}
                                        className="px-4 py-2 rounded-xl bg-zinc-800 text-white"
                                    >
                                        <span className="text-xl font-bold">{count}</span>
                                        <span className="text-zinc-400 ml-2">{make}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Attendee List */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Attendees ({event.attendees.length})
                    </h2>
                    <div className="space-y-3">
                        {event.attendees.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                                        {att.user.avatar ? (
                                            <img src={att.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-zinc-400">
                                                {(att.user.name || att.user.username)[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{att.user.name || att.user.username}</p>
                                        {att.car && (
                                            <p className="text-sm text-zinc-400">
                                                {att.car.generation?.model.make.name} {att.car.generation?.model.name}{' '}
                                                {att.car.nickname && `"${att.car.nickname}"`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {att.lookingForRide && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                                            Looking for ride
                                        </span>
                                    )}
                                    {att.hasEmptySeat && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                                            Has empty seat
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RSVP Modal */}
                {showRsvpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-4">RSVP to {event.title}</h3>

                            <div className="mb-4">
                                <label className="block text-sm text-zinc-400 mb-2">Which car are you bringing?</label>
                                <select
                                    value={selectedCarId}
                                    onChange={e => setSelectedCarId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white"
                                >
                                    <option value="">No car / Not sure yet</option>
                                    {userCars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.generation?.model.make.name} {car.generation?.model.name} {car.nickname && `"${car.nickname}"`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowRsvpModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleRsvp} disabled={rsvpLoading}>
                                    {rsvpLoading ? 'Saving...' : "I'm Going!"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Event Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Event?</h3>
                            {deleteConfirmCount !== null ? (
                                <p className="text-zinc-400 mb-6">
                                    This event has <span className="text-orange-400 font-semibold">{deleteConfirmCount} {deleteConfirmCount === 1 ? 'person' : 'people'}</span> signed up.
                                    Are you sure you want to cancel it?
                                </p>
                            ) : (
                                <p className="text-zinc-400 mb-6">
                                    Are you sure you want to delete this event? This action cannot be undone.
                                </p>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeleteConfirmCount(null)
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                    onClick={() => handleDeleteEvent(deleteConfirmCount !== null)}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : deleteConfirmCount !== null ? 'Yes, Delete Event' : 'Delete Event'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
