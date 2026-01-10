'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Loader2, ChevronRight, Flag, Car } from 'lucide-react'

interface SimTrack {
  id: string
  name: string
  slug: string
  country: string | null
  lengthMeters: number | null
  configuration: string | null
  _count: { lapTimes: number }
}

interface SimGame {
  id: string
  name: string
  slug: string
  shortName: string | null
}

export default function GameTracksPage() {
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const gameSlug = params?.gameSlug as string

  const [game, setGame] = useState<SimGame | null>(null)
  const [tracks, setTracks] = useState<SimTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(`/api/simracing/games/${gameSlug}/tracks`)
        if (res.ok) {
          const data = await res.json()
          setGame(data.game)
          setTracks(data.tracks)
        }
      } catch (error) {
        console.error('Failed to fetch tracks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, [gameSlug])

  const formatLength = (meters: number | null) => {
    if (!meters) return null
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters} m`
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/simracing`}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                {game?.shortName && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded">
                    {game.shortName}
                  </span>
                )}
                <h1 className="text-xl font-bold text-white font-heading">
                  {game?.name || 'Loading...'}
                </h1>
              </div>
              <p className="text-sm text-zinc-400">Select a track to view leaderboards</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20">
            <Flag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No tracks yet</h2>
            <p className="text-zinc-400">Tracks will be added soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/${locale}/simracing/${gameSlug}/${track.slug}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-all group flex items-center gap-4"
              >
                {/* Track Icon */}
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-purple-400" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors truncate">
                        {track.name}
                        {track.configuration && (
                          <span className="text-zinc-500 font-normal"> - {track.configuration}</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                        {track.country && (
                          <span className="flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {track.country}
                          </span>
                        )}
                        {track.lengthMeters && (
                          <span>{formatLength(track.lengthMeters)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-white font-medium">{track._count.lapTimes}</span>
                      <span className="text-zinc-500">times</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Cars Section */}
        {game && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Available Cars</h2>
            <Link
              href={`/${locale}/simracing/${gameSlug}/cars`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Car className="w-5 h-5" />
              View All Cars
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
