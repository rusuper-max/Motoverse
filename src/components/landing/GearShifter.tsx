'use client'

import { useCallback } from 'react'

export type GearPosition = 'N' | 1 | 2 | 3 | 4 | 5 | 'R'

interface GearShifterProps {
  currentGear: GearPosition
  onGearChange: (gear: GearPosition) => void
  onReverse?: () => void  // Special handler for reverse gear
  gearLabels?: Partial<Record<GearPosition, string>>
}

// H-pattern gear positions (x, y coordinates in percentage)
// Standard 5-speed + R layout
const gearPositions: Record<GearPosition, { x: number; y: number }> = {
  1: { x: 25, y: 15 },
  2: { x: 25, y: 85 },
  3: { x: 50, y: 15 },
  4: { x: 50, y: 85 },
  5: { x: 75, y: 15 },
  'R': { x: 75, y: 85 },  // Reverse in bottom-right
  'N': { x: 50, y: 50 },
}

// Gear order for scrolling (R is not included - click only)
const gearOrder: GearPosition[] = ['N', 1, 2, 3, 4, 5]

export default function GearShifter({ currentGear, onGearChange, onReverse, gearLabels }: GearShifterProps) {
  const currentPos = gearPositions[currentGear]

  const handleGearClick = useCallback((gear: GearPosition) => {
    if (gear === 'R' && onReverse) {
      onReverse()
    } else {
      onGearChange(gear)
    }
  }, [onGearChange, onReverse])

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
      {/* Gear shifter gate */}
      <div className="relative w-32 h-40 md:w-40 md:h-48 select-none">
        {/* Background plate */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-xl border-2 border-zinc-700 shadow-lg">
          {/* Brushed metal texture */}
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white via-transparent to-transparent rounded-xl" />
        </div>

        {/* H-pattern gate grooves */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Vertical lines */}
          <line x1="25" y1="15" x2="25" y2="85" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
          <line x1="50" y1="15" x2="50" y2="85" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
          <line x1="75" y1="15" x2="75" y2="85" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />

          {/* Horizontal connector (through neutral) */}
          <line x1="25" y1="50" x2="75" y2="50" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />

          {/* Inner groove shadows */}
          <line x1="25" y1="15" x2="25" y2="85" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="15" x2="50" y2="85" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
          <line x1="75" y1="15" x2="75" y2="85" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
          <line x1="25" y1="50" x2="75" y2="50" stroke="#18181b" strokeWidth="4" strokeLinecap="round" />
        </svg>

        {/* Gear position labels */}
        {Object.entries(gearPositions).map(([gearKey, pos]) => {
          // Convert string keys back to proper GearPosition type
          // Object.entries converts number keys to strings, so "1" -> 1, "N" -> "N"
          const gear: GearPosition = gearKey === 'N' || gearKey === 'R'
            ? gearKey
            : parseInt(gearKey, 10) as GearPosition

          return (
            <button
              key={gearKey}
              className="absolute w-6 h-6 md:w-8 md:h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs md:text-sm font-bold text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer z-10"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleGearClick(gear)}
            >
              {gearKey}
            </button>
          )
        })}

        {/* Shift knob */}
        <div
          className="absolute w-10 h-10 md:w-12 md:h-12 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-20"
          style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        >
          {/* Knob shadow */}
          <div className="absolute inset-0 translate-y-1 bg-black/40 rounded-full blur-sm" />

          {/* Knob base */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded-full border-2 border-zinc-500 shadow-lg" />

          {/* Knob top shine */}
          <div className="absolute inset-1 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-full" />

          {/* Knob center */}
          <div className="absolute inset-2 bg-gradient-to-b from-zinc-500 to-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs md:text-sm drop-shadow">
              {currentGear}
            </span>
          </div>

          {/* Orange glow when not in neutral */}
          {currentGear !== 'N' && (
            <div className="absolute -inset-1 bg-orange-500/30 rounded-full blur-md animate-pulse" />
          )}
        </div>
      </div>

      {/* Current gear info */}
      <div className="text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
          <div className={`text-4xl md:text-5xl font-bold ${currentGear === 'R' ? 'text-red-500' : 'text-white'}`}>
            {currentGear}
          </div>
          <div className="text-zinc-500 text-sm">
            {currentGear === 'N' ? 'Neutral' : currentGear === 'R' ? 'Reverse' : `Gear ${currentGear}`}
          </div>
        </div>

        {gearLabels && currentGear !== 'N' && gearLabels[currentGear] && (
          <div className={`font-medium text-sm md:text-base max-w-xs ${currentGear === 'R' ? 'text-red-400' : 'text-orange-400'}`}>
            {gearLabels[currentGear]}
          </div>
        )}

        {/* Scroll hint */}
        <div className="mt-4 flex items-center gap-2 text-zinc-600 text-xs">
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Scroll to shift gears
        </div>
      </div>
    </div>
  )
}

// Hook for managing gear state with scroll
export function useGearScroll(
  currentGear: GearPosition,
  onGearChange: (gear: GearPosition) => void
) {
  const shiftUp = useCallback(() => {
    const currentIndex = gearOrder.indexOf(currentGear)
    if (currentIndex < gearOrder.length - 1) {
      onGearChange(gearOrder[currentIndex + 1])
    }
  }, [currentGear, onGearChange])

  const shiftDown = useCallback(() => {
    const currentIndex = gearOrder.indexOf(currentGear)
    if (currentIndex > 0) {
      onGearChange(gearOrder[currentIndex - 1])
    }
  }, [currentGear, onGearChange])

  return { shiftUp, shiftDown, gearOrder }
}
