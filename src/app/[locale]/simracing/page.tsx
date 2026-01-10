'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Gamepad2, Trophy, Clock, Users, Loader2, ChevronRight, Monitor, Tv } from 'lucide-react'

interface SimGame {
  id: string
  name: string
  slug: string
  shortName: string | null
  logo: string | null
  coverImage: string | null
  platform: string[]
  _count: { tracks: number; cars: number; lapTimes: number }
}

const PLATFORM_ICONS: Record<string, typeof Monitor> = {
  'PC': Monitor,
  'PlayStation': Tv,
  'Xbox': Gamepad2,
}

export default function SimRacingPage() {
  const params = useParams()
  const locale = params?.locale as string || 'en'

  const [games, setGames] = useState<SimGame[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900/30 via-zinc-950 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-heading">Sim Racing</h1>
              <p className="text-zinc-400 text-lg">Track your virtual lap times</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <p className="text-3xl font-bold text-white font-mono">{games.length}</p>
              <p className="text-zinc-500 text-sm">Games</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-mono">
                {games.reduce((acc, g) => acc + g._count.tracks, 0)}
              </p>
              <p className="text-zinc-500 text-sm">Tracks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white font-mono">
                {games.reduce((acc, g) => acc + g._count.lapTimes, 0)}
              </p>
              <p className="text-zinc-500 text-sm">Lap Times</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href={`/${locale}/simracing/submit`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              <Clock className="w-5 h-5" />
              Submit Lap Time
            </Link>
            <Link
              href={`/${locale}/groups?category=simracing`}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              <Users className="w-5 h-5" />
              Racing Groups
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Select a Game</h2>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/${locale}/simracing/${game.slug}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group"
              >
                {/* Cover Image */}
                <div className="h-40 bg-gradient-to-br from-purple-600/20 to-zinc-800 relative">
                  {game.coverImage && (
                    <img
                      src={game.coverImage}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />

                  {/* Short Name Badge */}
                  {game.shortName && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-lg">
                      {game.shortName}
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {game.platform.map((p) => {
                      const Icon = PLATFORM_ICONS[p] || Monitor
                      return (
                        <div
                          key={p}
                          className="p-1.5 bg-black/60 rounded-lg"
                          title={p}
                        >
                          <Icon className="w-4 h-4 text-zinc-300" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                      {game.name}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-white font-medium">{game._count.tracks}</span>
                      <span className="text-zinc-500 ml-1">tracks</span>
                    </div>
                    <div>
                      <span className="text-white font-medium">{game._count.cars}</span>
                      <span className="text-zinc-500 ml-1">cars</span>
                    </div>
                    <div>
                      <span className="text-white font-medium">{game._count.lapTimes}</span>
                      <span className="text-zinc-500 ml-1">times</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">1. Submit Your Time</h3>
              <p className="text-zinc-400 text-sm">
                Choose your game, track, and car. Enter your lap time in mm:ss.xxx format.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">2. Upload Proof</h3>
              <p className="text-zinc-400 text-sm">
                Add a screenshot or video link to verify your time. This helps maintain fair competition.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">3. Compete</h3>
              <p className="text-zinc-400 text-sm">
                See how you rank against other sim racers. Challenge friends and improve your times!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
