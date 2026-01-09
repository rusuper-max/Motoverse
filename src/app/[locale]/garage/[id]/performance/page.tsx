'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Trophy, Upload, Loader2, X, FileImage } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface CarData {
    id: string
    year: number
    nickname: string | null
    generation?: {
        name: string
        displayName: string | null
        model: {
            name: string
            make: { name: string }
        }
    }
}

interface Track {
    id: string
    name: string
    slug: string
}

const CATEGORIES = [
    { id: '0-100', label: '0-100 km/h', description: 'Standing start to 100 km/h' },
    { id: '100-200', label: '100-200 km/h', description: 'Rolling from 100 to 200 km/h' },
    { id: '200-300', label: '200-300 km/h', description: 'Rolling from 200 to 300 km/h' },
    { id: '402m', label: '1/4 Mile (402m)', description: 'Quarter mile from standing start' },
    { id: '1000m', label: '1/2 Mile (1000m)', description: 'Half mile from standing start' },
    { id: 'track', label: 'Track Lap Time', description: 'Full lap time on a circuit' },
]

const WEATHER_OPTIONS = [
    { value: '', label: 'Select conditions' },
    { value: 'dry', label: 'Dry' },
    { value: 'wet', label: 'Wet' },
    { value: 'cold', label: 'Cold (<10°C)' },
    { value: 'hot', label: 'Hot (>30°C)' },
]

export default function SubmitPerformancePage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as Locale
    const carId = params.id as string

    const { user, loading: authLoading } = useAuth()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [car, setCar] = useState<CarData | null>(null)
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Form state
    const [category, setCategory] = useState('0-100')
    const [timeSeconds, setTimeSeconds] = useState('')
    const [timeMinutes, setTimeMinutes] = useState('')
    const [trackId, setTrackId] = useState('')
    const [proofUrl, setProofUrl] = useState('')
    const [proofType, setProofType] = useState('screenshot')
    const [proofUploading, setProofUploading] = useState(false)
    const [proofFileName, setProofFileName] = useState('')
    const [runDate, setRunDate] = useState(new Date().toISOString().split('T')[0])
    const [location, setLocation] = useState('')
    const [weather, setWeather] = useState('')

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user?.id) return

        setProofUploading(true)
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${user.id}/performance/${carId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('machinebio-photos')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                alert('Failed to upload proof file')
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('machinebio-photos')
                .getPublicUrl(filePath)

            setProofUrl(publicUrl)
            setProofFileName(file.name)

            // Auto-detect proof type based on file
            if (file.type.startsWith('video/')) {
                setProofType('video')
            } else if (file.type.startsWith('image/')) {
                setProofType('screenshot')
            }
        } catch (err) {
            console.error('Failed to upload proof:', err)
            alert('Failed to upload proof file')
        } finally {
            setProofUploading(false)
        }
    }

    const removeProof = () => {
        setProofUrl('')
        setProofFileName('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    useEffect(() => {
        fetchCar()
        fetchTracks()
    }, [carId])

    const fetchCar = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setCar(data.car)
                // Verify ownership
                if (data.car.ownerId !== user?.id) {
                    router.push(`/${locale}/garage`)
                }
            } else {
                router.push(`/${locale}/garage`)
            }
        } catch {
            router.push(`/${locale}/garage`)
        } finally {
            setLoading(false)
        }
    }

    const fetchTracks = async () => {
        try {
            const res = await fetch('/api/tracks')
            if (res.ok) {
                const data = await res.json()
                setTracks(data.tracks || [])
            }
        } catch {
            // ignore
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            // Convert time to milliseconds
            let timeMs: number
            if (category === 'track') {
                const mins = parseFloat(timeMinutes) || 0
                const secs = parseFloat(timeSeconds) || 0
                timeMs = Math.round((mins * 60 + secs) * 1000)
            } else {
                timeMs = Math.round(parseFloat(timeSeconds) * 1000)
            }

            if (isNaN(timeMs) || timeMs <= 0) {
                setError('Please enter a valid time')
                setSubmitting(false)
                return
            }

            const res = await fetch('/api/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    carId,
                    category,
                    timeMs,
                    trackId: category === 'track' ? trackId : null,
                    proofUrl: proofUrl || null,
                    proofType: proofUrl ? proofType : null,
                    runDate,
                    location: location || null,
                    weather: weather || null,
                }),
            })

            if (res.ok) {
                setSuccess(true)
            } else {
                const data = await res.json()
                setError(data.message || 'Failed to submit time')
            }
        } catch {
            setError('Failed to submit time')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!car) {
        return null
    }

    const carName = car.nickname || `${car.generation?.model.make.name} ${car.generation?.model.name}`
    const selectedCategory = CATEGORIES.find(c => c.id === category)

    if (success) {
        return (
            <div className="min-h-screen pt-20 pb-12">
                <div className="max-w-xl mx-auto px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Time Submitted!</h1>
                    <p className="text-zinc-400 mb-6">
                        Your performance time has been submitted and is pending review.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href={`/${locale}/garage/${carId}`}>
                            <Button variant="outline">Back to Car</Button>
                        </Link>
                        <Link href={`/${locale}/leaderboards`}>
                            <Button>View Leaderboards</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-xl mx-auto px-4">
                {/* Back button */}
                <Link
                    href={`/${locale}/garage/${carId}`}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {carName}
                </Link>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Submit Performance Time</h1>
                        <p className="text-zinc-400">{carName}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${category === cat.id
                                            ? 'border-orange-500 bg-orange-500/10 text-white'
                                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <p className="font-medium">{cat.label}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{cat.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Track Selection (for track category) */}
                    {category === 'track' && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Track</label>
                            <select
                                value={trackId}
                                onChange={e => setTrackId(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white"
                                required
                            >
                                <option value="">Select a track</option>
                                {tracks.map(track => (
                                    <option key={track.id} value={track.id}>{track.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Time Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            {selectedCategory?.label} Time
                        </label>
                        {category === 'track' ? (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={timeMinutes}
                                    onChange={e => setTimeMinutes(e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white text-center text-xl"
                                />
                                <span className="text-zinc-400">:</span>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="59.999"
                                    value={timeSeconds}
                                    onChange={e => setTimeSeconds(e.target.value)}
                                    placeholder="00.000"
                                    className="w-32 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white text-center text-xl"
                                />
                                <span className="text-zinc-500">(m:ss.ms)</span>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={timeSeconds}
                                    onChange={e => setTimeSeconds(e.target.value)}
                                    placeholder="0.00"
                                    className="w-32 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white text-center text-xl"
                                    required
                                />
                                <span className="text-zinc-400 text-lg">seconds</span>
                            </div>
                        )}
                    </div>

                    {/* Proof Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            <Upload className="w-4 h-4 inline mr-1" />
                            Proof (optional but recommended)
                        </label>

                        {proofUrl ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
                                <FileImage className="w-5 h-5 text-orange-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{proofFileName}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{proofType}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeProof}
                                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className={`flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors ${proofUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {proofUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                        <span className="text-zinc-400">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-zinc-500" />
                                        <span className="text-zinc-400">Upload screenshot, video, or telemetry file</span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*,.csv,.json"
                                    className="hidden"
                                    onChange={handleProofUpload}
                                    disabled={proofUploading}
                                />
                            </label>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                            Upload a screenshot, video, or telemetry export (Dragy, RaceBox, etc.)
                        </p>
                    </div>

                    {/* Conditions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
                            <input
                                type="date"
                                value={runDate}
                                onChange={e => setRunDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Weather</label>
                            <select
                                value={weather}
                                onChange={e => setWeather(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white"
                            >
                                {WEATHER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Location (optional)</label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g., Munich, Germany"
                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500"
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Time'}
                    </Button>

                    <p className="text-xs text-zinc-500 text-center">
                        Times are submitted for review. Verified times with proof will be marked on the leaderboard.
                    </p>
                </form>
            </div>
        </div>
    )
}
