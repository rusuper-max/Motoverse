'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Image, Type, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

const EVENT_TYPES = [
    { id: 'meet', label: 'Car Meet', description: 'Casual gathering of car enthusiasts' },
    { id: 'trackday', label: 'Track Day', description: 'Open track driving session' },
    { id: 'race', label: 'Race/Competition', description: 'Racing event or time attack' },
    { id: 'roadtrip', label: 'Road Trip', description: 'Group driving adventure' },
]

export default function CreateEventPage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as Locale

    const { authenticated, loading: authLoading } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('meet')
    const [location, setLocation] = useState('')
    const [city, setCity] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [coverImage, setCoverImage] = useState('')
    const [maxAttendees, setMaxAttendees] = useState('')

    useEffect(() => {
        if (!authLoading && !authenticated) {
            router.push(`/${locale}/login`)
        }
    }, [authLoading, authenticated, locale, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            // Combine date and time
            const dateTime = new Date(`${date}T${time}`)

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    description: description || null,
                    type,
                    location,
                    city: city || null,
                    date: dateTime.toISOString(),
                    coverImage: coverImage || null,
                    maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/${locale}/events/${data.event.id}`)
            } else {
                const data = await res.json()
                setError(data.message || 'Failed to create event')
            }
        } catch {
            setError('Failed to create event')
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-xl mx-auto px-4">
                {/* Back */}
                <Link
                    href={`/${locale}/events`}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Events
                </Link>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create Event</h1>
                        <p className="text-zinc-400">Host a car meet or gathering</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Event Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {EVENT_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${type === t.id
                                            ? 'border-orange-500 bg-orange-500/10 text-white'
                                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <p className="font-medium">{t.label}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            <Type className="w-4 h-4 inline mr-1" />
                            Event Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Coffee & Cars Munich"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Tell people what to expect..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g., Starbucks parking lot, Main Street 123"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            placeholder="e.g., Munich"
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            <Image className="w-4 h-4 inline mr-1" />
                            Cover Image URL (optional)
                        </label>
                        <input
                            type="url"
                            value={coverImage}
                            onChange={e => setCoverImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Max Attendees */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Max Attendees (optional)</label>
                        <input
                            type="number"
                            value={maxAttendees}
                            onChange={e => setMaxAttendees(e.target.value)}
                            placeholder="Leave empty for unlimited"
                            min="1"
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Event'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
