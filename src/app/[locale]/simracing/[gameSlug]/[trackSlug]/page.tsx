'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Trophy, Clock, Loader2, Medal, Flag, Filter } from 'lucide-react'

interface LeaderboardEntry {
  position: number
  id: string
  timeMs: number
  timeFormatted: string
  gap: string | null
  weather: string | null
  assists: string | null
  car: { id: string; name: string; class: string | null }
  user: { id: string; username: string; name: string | null; avatar: string | null }
  createdAt: string
}

interface Track {
  id: string
  name: string
  configuration: string | null
  country: string | null
}

interface Game {
  id: string
  name: string
  shortName: string | null
}

export default function TrackLeaderboardPage() {
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const gameSlug = params?.gameSlug as string
  const trackSlug = params?.trackSlug as string

  const [game, setGame] = useState<Game | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [trackRecord, setTrackRecord] = useState<LeaderboardEntry | null>(null)
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          gameId: gameSlug,
          trackId: trackSlug,
        })
        if (selectedClass) {
          params.set('class', selectedClass)
        }

        const res = await fetch(`/api/simracing/leaderboard?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setGame(data.game)
          setTrack(data.track)
          setLeaderboard(data.leaderboard)
          setTrackRecord(data.trackRecord)
          setAvailableClasses(data.availableClasses || [])
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [gameSlug, trackSlug, selectedClass])

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400'
      case 2: return 'text-zinc-300'
      case 3: return 'text-amber-600'
      default: return 'text-zinc-600'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/simracing/${gameSlug}`}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                {game?.shortName && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded">
                    {game.shortName}
                  </span>
                )}
                <span>{game?.name}</span>
              </div>
              <h1 className="text-xl font-bold text-white font-heading">
                {track?.name}
                {track?.configuration && (
                  <span className="text-zinc-500 font-normal text-lg"> - {track.configuration}</span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Track Record Card */}
        {trackRecord && (
          <div className="bg-gradient-to-br from-purple-900/30 to-zinc-900 border border-purple-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 text-purple-400 mb-4">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Track Record</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden">
                  {trackRecord.user.avatar ? (
                    <img src={trackRecord.user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                      {trackRecord.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <Link
                    href={`/${locale}/u/${trackRecord.user.username}`}
                    className="text-white font-semibold hover:text-purple-400"
                  >
                    {trackRecord.user.name || trackRecord.user.username}
                  </Link>
                  <p className="text-sm text-zinc-400">{trackRecord.car.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white font-mono">{trackRecord.timeFormatted}</p>
                {trackRecord.weather && (
                  <p className="text-sm text-zinc-400">{trackRecord.weather} conditions</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Class Filter */}
        {availableClasses.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="w-4 h-4 text-zinc-500" />
            <button
              onClick={() => setSelectedClass('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedClass === ''
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All Classes
            </button>
            {availableClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedClass === cls
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Clock className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No lap times yet</h2>
            <p className="text-zinc-400 mb-4">Be the first to set a time!</p>
            <Link
              href={`/${locale}/simracing/submit?game=${gameSlug}&track=${trackSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Clock className="w-5 h-5" />
              Submit Lap Time
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-zinc-800 text-sm font-medium text-zinc-400">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Driver</div>
              <div className="col-span-3">Car</div>
              <div className="col-span-2 text-right">Time</div>
              <div className="col-span-2 text-right">Gap</div>
            </div>

            {/* Rows */}
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-zinc-800/50 transition-colors ${
                  entry.position <= 3 ? 'bg-zinc-800/30' : ''
                }`}
              >
                {/* Position */}
                <div className="col-span-1">
                  {entry.position <= 3 ? (
                    <Medal className={`w-5 h-5 ${getMedalColor(entry.position)}`} />
                  ) : (
                    <span className="text-zinc-500 font-mono">{entry.position}</span>
                  )}
                </div>

                {/* Driver */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                    {entry.user.avatar ? (
                      <img src={entry.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-bold">
                        {entry.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/${locale}/u/${entry.user.username}`}
                    className="text-white hover:text-purple-400 truncate"
                  >
                    {entry.user.name || entry.user.username}
                  </Link>
                </div>

                {/* Car */}
                <div className="col-span-3">
                  <p className="text-zinc-300 text-sm truncate">{entry.car.name}</p>
                  {entry.car.class && (
                    <span className="text-xs text-zinc-500">{entry.car.class}</span>
                  )}
                </div>

                {/* Time */}
                <div className="col-span-2 text-right">
                  <span className="text-white font-mono font-medium">{entry.timeFormatted}</span>
                </div>

                {/* Gap */}
                <div className="col-span-2 text-right">
                  {entry.gap ? (
                    <span className="text-zinc-400 font-mono text-sm">{entry.gap}</span>
                  ) : (
                    <span className="text-purple-400 font-mono text-sm">LEADER</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/simracing/submit?game=${gameSlug}&track=${trackSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Clock className="w-5 h-5" />
            Submit Your Time
          </Link>
        </div>
      </div>
    </div>
  )
}
