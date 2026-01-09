'use client'

import Link from 'next/link'
import { MapPin, MessageCircle, HelpCircle, Star, Check, X } from 'lucide-react'

interface SpotCardProps {
  spot: {
    id: string
    imageUrl: string
    thumbnail?: string | null
    caption?: string | null
    locationName?: string | null
    make?: string | null
    model?: string | null
    year?: number | null
    isChallenge: boolean
    isIdentified: boolean
    revealedAt?: string | null
    avgRarity?: number | null
    hasGuessed?: boolean
    userGuess?: {
      make: string
      model: string
      isCorrect?: boolean | null
    } | null
    spotter: {
      id: string
      username: string
      name?: string | null
      avatar?: string | null
    }
    _count: {
      guesses: number
      comments: number
    }
    createdAt: string
  }
  locale: string
}

export default function SpotCard({ spot, locale }: SpotCardProps) {
  const isRevealed = !!spot.revealedAt
  const carName = spot.isIdentified && spot.make
    ? `${spot.make} ${spot.model || ''}${spot.year ? ` (${spot.year})` : ''}`
    : null

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Link href={`/${locale}/spots/${spot.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group">
        {/* Image */}
        <div className="relative aspect-[4/3]">
          <img
            src={spot.thumbnail || spot.imageUrl}
            alt={spot.caption || 'Car spot'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Challenge badge */}
          {spot.isChallenge && (
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              isRevealed
                ? 'bg-green-500/90 text-white'
                : 'bg-orange-500/90 text-white'
            }`}>
              {isRevealed ? (
                <>
                  <Check className="w-3 h-3" />
                  Revealed
                </>
              ) : (
                <>
                  <HelpCircle className="w-3 h-3" />
                  Challenge
                </>
              )}
            </div>
          )}

          {/* User's guess result (if challenge) */}
          {spot.isChallenge && spot.hasGuessed && isRevealed && spot.userGuess && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              spot.userGuess.isCorrect
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}>
              {spot.userGuess.isCorrect ? (
                <>
                  <Check className="w-3 h-3" />
                  Correct
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  Wrong
                </>
              )}
            </div>
          )}

          {/* Rarity score */}
          {spot.avgRarity && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/90 rounded-lg text-xs font-semibold text-white flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {spot.avgRarity.toFixed(1)}
            </div>
          )}

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Car name or mystery */}
            <div className="mb-1">
              {carName ? (
                <p className="text-white font-semibold text-sm truncate">{carName}</p>
              ) : spot.isChallenge && !isRevealed ? (
                <p className="text-orange-400 font-semibold text-sm">What car is this?</p>
              ) : (
                <p className="text-zinc-400 text-sm">Unknown car</p>
              )}
            </div>

            {/* Location */}
            {spot.locationName && (
              <div className="flex items-center gap-1 text-zinc-300 text-xs">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{spot.locationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          {/* Spotter info */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden">
              {spot.spotter.avatar ? (
                <img src={spot.spotter.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white">
                  {spot.spotter.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-zinc-400 text-xs">{spot.spotter.username}</span>
            <span className="text-zinc-600 text-xs">{formatTimeAgo(spot.createdAt)}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-zinc-500 text-xs">
            {spot.isChallenge && (
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                <span>{spot._count.guesses}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{spot._count.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
