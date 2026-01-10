'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, Upload, Check, Gamepad2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SimGame {
  id: string
  name: string
  slug: string
  shortName: string | null
}

interface SimTrack {
  id: string
  name: string
  configuration: string | null
}

interface SimCar {
  id: string
  name: string
  class: string | null
}

function SubmitLapTimeContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params?.locale as string || 'en'
  const { authenticated, user, loading: authLoading } = useAuth()

  const [games, setGames] = useState<SimGame[]>([])
  const [tracks, setTracks] = useState<SimTrack[]>([])
  const [cars, setCars] = useState<SimCar[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    gameId: searchParams.get('game') || '',
    trackId: searchParams.get('track') || '',
    carId: '',
    minutes: '',
    seconds: '',
    milliseconds: '',
    weather: 'Dry',
    assists: 'None',
    proofUrl: '',
    proofType: 'video',
    setupNotes: '',
  })

  // Fetch games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/simracing/games')
        if (res.ok) {
          const data = await res.json()
          setGames(data.games)
        }
      } catch (error) {
        console.error('Failed to fetch games:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [])

  // Fetch tracks when game changes
  useEffect(() => {
    if (!formData.gameId) {
      setTracks([])
      return
    }

    const fetchTracks = async () => {
      try {
        const res = await fetch(`/api/simracing/games/${formData.gameId}/tracks`)
        if (res.ok) {
          const data = await res.json()
          setTracks(data.tracks)
        }
      } catch (error) {
        console.error('Failed to fetch tracks:', error)
      }
    }
    fetchTracks()
  }, [formData.gameId])

  // Fetch cars when game changes
  useEffect(() => {
    if (!formData.gameId) {
      setCars([])
      return
    }

    const fetchCars = async () => {
      try {
        const res = await fetch(`/api/simracing/games/${formData.gameId}/cars`)
        if (res.ok) {
          const data = await res.json()
          setCars(data.cars)
        }
      } catch (error) {
        console.error('Failed to fetch cars:', error)
      }
    }
    fetchCars()
  }, [formData.gameId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate
    if (!formData.gameId || !formData.trackId || !formData.carId) {
      setError('Please select game, track, and car')
      return
    }

    const minutes = parseInt(formData.minutes) || 0
    const seconds = parseInt(formData.seconds) || 0
    const milliseconds = parseInt(formData.milliseconds) || 0

    if (seconds >= 60 || milliseconds >= 1000) {
      setError('Invalid time format')
      return
    }

    const timeMs = (minutes * 60000) + (seconds * 1000) + milliseconds

    if (timeMs <= 0) {
      setError('Please enter a valid lap time')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/simracing/laptimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: formData.gameId,
          trackId: formData.trackId,
          carId: formData.carId,
          timeMs,
          weather: formData.weather || null,
          assists: formData.assists || null,
          proofUrl: formData.proofUrl || null,
          proofType: formData.proofUrl ? formData.proofType : null,
          setupNotes: formData.setupNotes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit lap time')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/simracing/${formData.gameId}/${formData.trackId}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    router.push(`/${locale}/login`)
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Lap Time Submitted!</h2>
          <p className="text-zinc-400">Your time is pending verification.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/simracing`}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-400" />
              Submit Lap Time
            </h1>
            <p className="text-zinc-400 text-sm">Add your time to the leaderboards</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Game <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.gameId}
              onChange={(e) => setFormData({ ...formData, gameId: e.target.value, trackId: '', carId: '' })}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game.id} value={game.slug}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* Track Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Track <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.trackId}
              onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              disabled={!formData.gameId}
              required
            >
              <option value="">Select a track</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}{track.configuration ? ` - ${track.configuration}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Car Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Car <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.carId}
              onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              disabled={!formData.gameId}
              required
            >
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}{car.class ? ` (${car.class})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lap Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Lap Time <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                placeholder="0"
                min="0"
                max="59"
                className="w-20 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-center font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-zinc-500 text-xl">:</span>
              <input
                type="number"
                value={formData.seconds}
                onChange={(e) => setFormData({ ...formData, seconds: e.target.value })}
                placeholder="00"
                min="0"
                max="59"
                className="w-20 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-center font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-zinc-500 text-xl">.</span>
              <input
                type="number"
                value={formData.milliseconds}
                onChange={(e) => setFormData({ ...formData, milliseconds: e.target.value })}
                placeholder="000"
                min="0"
                max="999"
                className="w-24 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-center font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Format: minutes : seconds . milliseconds</p>
          </div>

          {/* Weather & Assists */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Weather</label>
              <select
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Assists</label>
              <select
                value={formData.assists}
                onChange={(e) => setFormData({ ...formData, assists: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="None">None</option>
                <option value="TC Only">TC Only</option>
                <option value="ABS Only">ABS Only</option>
                <option value="TC + ABS">TC + ABS</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>

          {/* Proof */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Proof URL
              <span className="text-zinc-500 font-normal ml-2">(Video or screenshot)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.proofType}
                onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                className="w-32 px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="video">Video</option>
                <option value="screenshot">Screenshot</option>
                <option value="telemetry">Telemetry</option>
              </select>
              <input
                type="url"
                value={formData.proofUrl}
                onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Adding proof helps get your time verified faster
            </p>
          </div>

          {/* Setup Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Setup Notes
              <span className="text-zinc-500 font-normal ml-2">(Optional)</span>
            </label>
            <textarea
              value={formData.setupNotes}
              onChange={(e) => setFormData({ ...formData, setupNotes: e.target.value })}
              rows={3}
              placeholder="Any notes about your setup..."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/simracing`}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-center font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit Time
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubmitLapTimePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <SubmitLapTimeContent />
    </Suspense>
  )
}
