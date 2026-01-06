'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { Car, Wrench, Users, ShoppingBag, Sparkles, LucideIcon } from 'lucide-react'
import GearShifter, { GearPosition, useGearScroll } from './GearShifter'

interface Feature {
  id: string
  title: string
  description: string
}

// Map feature ids to icons
const featureIcons: Record<string, LucideIcon> = {
  garage: Car,
  builds: Wrench,
  community: Users,
  marketplace: ShoppingBag,
  events: Sparkles,
}

interface InteractiveLandingProps {
  features: Feature[]
  children: ReactNode
  dict: {
    gearShifter: {
      scrollToShift: string
      neutral: string
      reverse: string
    }
  }
}

// Map gear numbers to feature indices (Gear 1 = feature 0, etc.)
const gearToFeatureIndex = (gear: GearPosition): number | null => {
  if (gear === 'N' || gear === 'R') return null
  if (typeof gear === 'number' && gear >= 1 && gear <= 5) {
    return gear - 1
  }
  return null
}

export default function InteractiveLanding({ features, children, dict }: InteractiveLandingProps) {
  const [currentGear, setCurrentGear] = useState<GearPosition>('N')
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const shifterSectionRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const { shiftUp, shiftDown } = useGearScroll(currentGear, setCurrentGear)

  // Handle scroll events to shift gears when in the interactive section
  useEffect(() => {
    let accumulatedDelta = 0
    const SCROLL_THRESHOLD = 50  // Amount of scroll needed to trigger gear change

    const handleWheel = (e: WheelEvent) => {
      // Check if shifter section is in view
      const shifterSection = shifterSectionRef.current
      if (!shifterSection) return

      const rect = shifterSection.getBoundingClientRect()
      // Shifter is in view if its top is above middle of screen and bottom is below top
      const isShifterVisible = rect.top <= window.innerHeight * 0.6 && rect.bottom >= 50

      // Only intercept scroll when shifter is visible
      if (!isShifterVisible) {
        accumulatedDelta = 0
        return
      }

      // Check if we can shift in the desired direction
      // R (reverse) is not part of scroll - only gears N, 1-5
      const currentIndex = currentGear === 'N' ? 0 : currentGear === 'R' ? 0 : currentGear as number
      const maxGear = Math.min(features.length, 5)  // Max 5 gears for scrolling

      // Accumulate scroll delta
      accumulatedDelta += e.deltaY

      // Check if we've scrolled enough to trigger a gear change
      if (Math.abs(accumulatedDelta) >= SCROLL_THRESHOLD) {
        if (accumulatedDelta > 0 && currentIndex < maxGear) {
          // Scrolling down - shift up (to higher gear)
          e.preventDefault()
          shiftUp()
          accumulatedDelta = 0
        } else if (accumulatedDelta < 0 && currentIndex > 0) {
          // Scrolling up - shift down (to lower gear)
          e.preventDefault()
          shiftDown()
          accumulatedDelta = 0
        } else {
          // Can't shift further, allow normal scroll
          accumulatedDelta = 0
        }
      } else {
        // Not enough scroll yet, prevent default to accumulate
        if ((accumulatedDelta > 0 && currentIndex < maxGear) ||
            (accumulatedDelta < 0 && currentIndex > 0)) {
          e.preventDefault()
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [currentGear, features.length, shiftUp, shiftDown])

  // Scroll to keep shifter visible when gear changes (don't scroll to feature, just highlight it)
  useEffect(() => {
    const shifterSection = shifterSectionRef.current
    if (!shifterSection) return

    // Only scroll if we're in a numbered gear (not neutral or reverse)
    if (currentGear !== 'N' && currentGear !== 'R') {
      const rect = shifterSection.getBoundingClientRect()

      // Only scroll if the shifter is significantly out of view
      // (too far up or too far down from the ideal position)
      const isAboveView = rect.top < -50  // Shifter has scrolled off top
      const isBelowIdealPosition = rect.top > window.innerHeight * 0.3  // Shifter is too low

      if (isAboveView || isBelowIdealPosition) {
        // Small delay to let gear knob animation start first
        setTimeout(() => {
          const scrollTop = window.scrollY + rect.top - 80 // Keep shifter 80px from top
          window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
        }, 50)
      }
    }
  }, [currentGear])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        shiftUp()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        shiftDown()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shiftUp, shiftDown])

  // Create gear labels from features
  const gearLabels: Partial<Record<GearPosition, string>> = {
    'N': dict.gearShifter.neutral,
    1: features[0]?.title || '',
    2: features[1]?.title || '',
    3: features[2]?.title || '',
    4: features[3]?.title || '',
    5: features[4]?.title || '',
    'R': dict.gearShifter.reverse,
  }

  const activeFeatureIndex = gearToFeatureIndex(currentGear)

  // Handle reverse - scroll to top of page
  const handleReverse = () => {
    setCurrentGear('R')
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    // After scrolling to top, reset to neutral
    setTimeout(() => {
      setCurrentGear('N')
    }, 800)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Hero content passed as children */}
      {children}

      {/* Gear Shifter Section - Between hero and features */}
      <section
        ref={shifterSectionRef}
        className="py-12 md:py-16 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950 border-y border-zinc-800/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <GearShifter
              currentGear={currentGear}
              onGearChange={setCurrentGear}
              onReverse={handleReverse}
              gearLabels={gearLabels}
            />
          </div>
        </div>
      </section>

      {/* Features Section with highlighting */}
      <section className="py-24 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => {
              const isActive = activeFeatureIndex === index
              const gearNumber = index + 1
              const Icon = featureIcons[feature.id]

              return (
                <div
                  key={feature.id}
                  ref={(el) => { featureRefs.current[index] = el }}
                  className={`relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800/80 border-orange-500 shadow-lg shadow-orange-500/20 scale-105'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                  onClick={() => setCurrentGear(gearNumber as GearPosition)}
                >
                  {/* Gear number badge */}
                  <div
                    className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {gearNumber}
                  </div>

                  {/* Icon */}
                  {Icon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      isActive ? 'bg-orange-500/20' : 'bg-orange-500/10'
                    }`}>
                      <Icon className={`w-6 h-6 transition-colors ${
                        isActive ? 'text-orange-400' : 'text-orange-500'
                      }`} />
                    </div>
                  )}

                  <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                    isActive ? 'text-orange-400' : 'text-white'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400">{feature.description}</p>

                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
