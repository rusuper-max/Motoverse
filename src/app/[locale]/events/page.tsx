'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Users, Plus, Car, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface Event {
    id: string
    title: string
    description: string | null
    type: string
    location: string
    city: string | null
    country: string | null
    date: string
    coverImage: string | null
    organizer: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    _count: {
        attendees: number
    }
    attendees: Array<{
        car?: {
            generation?: {
                model: {
                    name: string
                    make: { name: string }
                }
            }
        }
    }>
}

const EVENT_TYPES = [
    { id: '', label: 'All' },
    { id: 'watching', label: '🏁 Racing Calendar' },
    { id: 'meet', label: 'Car Meets' },
    { id: 'trackday', label: 'Track Days' },
    { id: 'race', label: 'Races' },
    { id: 'roadtrip', label: 'Road Trips' },
]

export default function EventsPage() {
    const params = useParams()
    const locale = params.locale as Locale
    const dict = getDictionary(locale)

    const { authenticated } = useAuth()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('')

    useEffect(() => {
        fetchEvents()
    }, [typeFilter])

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams({ upcoming: 'true' })
            if (typeFilter) queryParams.set('type', typeFilter)

            const res = await fetch(`/api/events?${queryParams}`)
            if (res.ok) {
                const data = await res.json()
                setEvents(data.events || [])
            }
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString(locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Count cars by make for each event
    const getTopMakes = (event: Event) => {
        const counts: Record<string, number> = {}
        event.attendees.forEach(att => {
            if (att.car?.generation?.model?.make?.name) {
                const make = att.car.generation.model.make.name
                counts[make] = (counts[make] || 0) + 1
            }
        })
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
    }

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Events</h1>
                            <p className="text-zinc-400">Car meets, track days & road trips</p>
                        </div>
                    </div>
                    {authenticated && (
                        <Link href={`/${locale}/events/create`}>
                            <Button>
                                <Plus className="w-5 h-5 mr-2" />
                                Create Event
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Type Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {EVENT_TYPES.map(type => (
                        type.id === 'watching' ? (
                            <Link
                                key={type.id}
                                href={`/${locale}/racing`}
                                className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500"
                            >
                                {type.label}
                            </Link>
                        ) : (
                            <button
                                key={type.id}
                                onClick={() => setTypeFilter(type.id)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${typeFilter === type.id
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                {type.label}
                            </button>
                        )
                    ))}
                </div>

                {/* Events List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No upcoming events</h2>
                        <p className="text-zinc-400 mb-6">Be the first to create one!</p>
                        {authenticated && (
                            <Link href={`/${locale}/events/create`}>
                                <Button>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Event
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {events.map(event => (
                            <Link
                                key={event.id}
                                href={`/${locale}/events/${event.id}`}
                                className="group"
                            >
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-colors">
                                    {/* Cover Image */}
                                    {event.coverImage ? (
                                        <div className="aspect-[2/1] bg-zinc-800">
                                            <img
                                                src={event.coverImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-[2/1] bg-gradient-to-br from-orange-900/50 to-amber-900/50 flex items-center justify-center">
                                            <Car className="w-16 h-16 text-orange-500/50" />
                                        </div>
                                    )}

                                    <div className="p-4">
                                        {/* Type Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${event.title.includes('F1') ? 'bg-red-500/20 text-red-300' :
                                                event.title.includes('WRC') ? 'bg-blue-500/20 text-blue-300' :
                                                    event.title.includes('GT') || event.title.includes('24 Hours') ? 'bg-green-500/20 text-green-300' :
                                                        'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {event.title.includes('F1') ? '🏎️ F1' :
                                                    event.title.includes('WRC') ? '🚗 WRC' :
                                                        event.title.includes('GT') || event.title.includes('24 Hours') ? '🏁 GT3' :
                                                            event.type}
                                            </span>
                                            {event._count.attendees > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                                    <Users className="w-3 h-3" />
                                                    {event._count.attendees} going
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                                            {event.title}
                                        </h3>

                                        {/* Date & Location */}
                                        <div className="flex flex-col gap-1 mt-2 text-sm text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(event.date)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {event.location}
                                            </div>
                                        </div>

                                        {/* Who's Going - Car Makes */}
                                        {getTopMakes(event).length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800">
                                                <p className="text-xs text-zinc-500 mb-1">Cars going:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getTopMakes(event).map(([make, count]) => (
                                                        <span
                                                            key={make}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300"
                                                        >
                                                            {count} {make}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
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
