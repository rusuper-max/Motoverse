'use client'

import { useState, useRef, useCallback } from 'react'

interface RevLimiterRatingProps {
  value: number | null // 0-10000
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
}

export default function RevLimiterRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = true,
  label,
}: RevLimiterRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const displayValue = hoverValue ?? value ?? 0

  // Size configurations
  const sizeConfig = {
    sm: { width: 180, barHeight: 8, fontSize: 9 },
    md: { width: 240, barHeight: 10, fontSize: 10 },
    lg: { width: 320, barHeight: 12, fontSize: 12 },
  }

  const config = sizeConfig[size]
  const isInRedZone = displayValue >= 8000

  // Convert mouse position to value (0-10000)
  const positionToValue = useCallback((clientX: number) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    return Math.round(percentage * 100) * 100
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    if (readonly || !onChange) return
    const newValue = positionToValue(e.clientX)
    onChange(newValue)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readonly) return
    const newValue = positionToValue(e.clientX)
    setHoverValue(newValue)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const fillPercentage = displayValue / 10000 * 100
  const redZoneStart = 80

  return (
    <div className="flex flex-col items-center" style={{ width: config.width }}>
      {/* Scale numbers above */}
      <div className="w-full flex justify-between px-0.5 mb-1.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <span
            key={num}
            className={`font-medium transition-colors ${
              num >= 8 ? 'text-red-500' : 'text-zinc-500'
            } ${displayValue / 1000 >= num && displayValue / 1000 < num + 1 ? (num >= 8 ? 'text-red-400' : 'text-zinc-300') : ''}`}
            style={{ fontSize: config.fontSize, width: '1ch', textAlign: 'center' }}
          >
            {num}
          </span>
        ))}
      </div>

      {/* Main bar container */}
      <div
        ref={barRef}
        className={`relative w-full ${!readonly ? 'cursor-pointer' : ''} group`}
        style={{ height: config.barHeight + 16 }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Tick marks */}
        <div className="absolute top-0 w-full flex justify-between px-0.5" style={{ height: 6 }}>
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className={`w-px transition-colors ${
                i >= 8 ? 'bg-red-500/60' : 'bg-zinc-600'
              }`}
              style={{ height: i % 2 === 0 ? 6 : 4 }}
            />
          ))}
        </div>

        {/* Bar track */}
        <div
          className="absolute left-0 right-0 rounded-full overflow-hidden"
          style={{ top: 8, height: config.barHeight }}
        >
          {/* Background gradient track */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-full" />

          {/* Subtle inner shadow */}
          <div className="absolute inset-0 rounded-full shadow-inner" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />

          {/* Segment lines for premium look */}
          <div className="absolute inset-0 flex">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-zinc-950/30 last:border-r-0"
              />
            ))}
          </div>

          {/* Green zone glow background */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-full"
            style={{
              width: `${redZoneStart}%`,
              background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.15))',
            }}
          />

          {/* Red zone glow background */}
          <div
            className="absolute inset-y-0 right-0 rounded-r-full"
            style={{
              width: `${100 - redZoneStart}%`,
              background: 'linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.25))',
            }}
          />

          {/* Fill bar with gradient */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-75 ease-out"
            style={{
              width: `${fillPercentage}%`,
              background: fillPercentage > redZoneStart
                ? `linear-gradient(to right,
                    #15803d 0%,
                    #22c55e ${(redZoneStart / fillPercentage) * 100 - 5}%,
                    #facc15 ${(redZoneStart / fillPercentage) * 100}%,
                    #ef4444 ${(redZoneStart / fillPercentage) * 100 + 10}%,
                    #dc2626 100%)`
                : 'linear-gradient(to right, #15803d 0%, #22c55e 60%, #4ade80 100%)',
              boxShadow: isInRedZone
                ? '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 0 12px rgba(34, 197, 94, 0.4), 0 0 24px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          />

          {/* Glossy overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />
        </div>

        {/* Needle indicator */}
        <div
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: `calc(${fillPercentage}% - 1px)`,
            top: 6,
            height: config.barHeight + 4,
          }}
        >
          {/* Needle line */}
          <div
            className="w-0.5 h-full rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #fff, #e5e5e5)',
              boxShadow: `0 0 6px rgba(255, 255, 255, 0.8), 0 0 12px ${isInRedZone ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'}`,
            }}
          />
        </div>
      </div>

      {/* Digital readout */}
      {showValue && (
        <div className="mt-3 relative">
          {/* LCD-style background */}
          <div
            className="px-4 py-1.5 rounded-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Scanline effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              }}
            />

            <span
              className={`font-mono font-bold tracking-wider relative ${
                isInRedZone ? 'text-red-500' : 'text-emerald-400'
              }`}
              style={{
                fontSize: config.fontSize + 6,
                textShadow: isInRedZone
                  ? '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 0 10px rgba(52, 211, 153, 0.8), 0 0 20px rgba(52, 211, 153, 0.4)',
              }}
            >
              {(displayValue / 1000).toFixed(1)}
            </span>
            <span
              className={`ml-1 font-mono font-medium ${isInRedZone ? 'text-red-500/70' : 'text-emerald-400/70'}`}
              style={{ fontSize: config.fontSize + 2 }}
            >
              RPM
            </span>
          </div>
        </div>
      )}

      {label && (
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wider">{label}</p>
      )}
    </div>
  )
}
