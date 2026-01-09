'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface RarityRatingProps {
  value: number | null
  avgRating: number | null
  ratingCount?: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function RarityRating({
  value,
  avgRating,
  ratingCount = 0,
  onChange,
  readonly = false,
  size = 'md',
}: RarityRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0
  const stars = 10

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Stars */}
      <div
        className="flex gap-0.5"
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: stars }, (_, i) => {
          const starValue = i + 1
          const isFilled = starValue <= displayValue

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => !readonly && setHoverValue(starValue)}
              disabled={readonly}
              className={`transition-all ${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'text-purple-400 fill-purple-400'
                    : 'text-zinc-700'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Rating info */}
      <div className="text-center">
        {avgRating !== null ? (
          <p className="text-sm text-zinc-400">
            <span className="text-purple-400 font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-zinc-600">/10</span>
            <span className="text-zinc-600 ml-1">({ratingCount} ratings)</span>
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No ratings yet</p>
        )}
        {value && (
          <p className="text-xs text-zinc-500 mt-0.5">
            Your rating: {value}/10
          </p>
        )}
      </div>
    </div>
  )
}
