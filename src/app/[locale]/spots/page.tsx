'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Camera, Plus, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import SpotCard from '@/components/spots/SpotCard'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface SpotData {
  id: string
  imageUrl: string
  thumbnail: string | null
  caption: string | null
  locationName: string | null
  make: string | null
  model: string | null
  year: number | null
  isChallenge: boolean
  isIdentified: boolean
  revealedAt: string | null
  avgRarity: number | null
  hasGuessed: boolean
  userGuess: {
    make: string
    model: string
    isCorrect: boolean | null
  } | null
  spotter: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  _count: {
    guesses: number
    comments: number
  }
  createdAt: string
}

type Filter = 'all' | 'challenges' | 'mine'

export default function SpotsPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.spots

  const { authenticated, loading: authLoading } = useAuth()

  const [spots, setSpots] = useState<SpotData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetchSpots()
  }, [filter])

  const fetchSpots = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/spots?filter=${filter}&limit=30`)
      const data = await res.json()
      setSpots(data.spots || [])
    } catch (error) {
      console.error('Failed to fetch spots:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t.filters.all },
    { key: 'challenges', label: t.filters.challenges },
    { key: 'mine', label: t.filters.mySpots },
  ]

  const getEmptyMessage = () => {
    switch (filter) {
      case 'mine':
        return t.emptyMine
      case 'challenges':
        return t.emptyChallenges
      default:
        return t.empty
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Camera className="w-8 h-8 text-orange-500" />
              {t.title}
            </h1>
            <p className="text-zinc-400 mt-1">{t.subtitle}</p>
          </div>
          {authenticated && (
            <Link href={`/${locale}/spots/new`}>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                {t.newSpot}
              </Button>
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              disabled={f.key === 'mine' && !authenticated}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading || authLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : spots.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Camera className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {getEmptyMessage()}
            </h3>
            {authenticated && filter !== 'mine' && (
              <Link href={`/${locale}/spots/new`}>
                <Button className="mt-4">
                  <Plus className="w-5 h-5 mr-2" />
                  {t.newSpot}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          /* Spots Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
