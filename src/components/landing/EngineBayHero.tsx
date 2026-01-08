'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface EngineBayHeroProps {
  onRpmChange?: (rpm: number) => void
}

export default function EngineBayHero({ onRpmChange }: EngineBayHeroProps) {
  const [rpm, setRpm] = useState(800)
  const [isThrottling, setIsThrottling] = useState(false)
  const targetRpmRef = useRef(800)
  const animationRef = useRef<number | null>(null)

  // Smooth RPM animation - realistic engine behavior
  useEffect(() => {
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000 // Convert to seconds
      lastTime = currentTime

      setRpm(currentRpm => {
        const target = targetRpmRef.current

        if (isThrottling) {
          // Revving up - gradual acceleration that gets slower as RPM increases
          // Like a real engine - quick initial response, slower near redline
          const rpmRatio = currentRpm / 9000
          const accelRate = 2500 * (1 - rpmRatio * 0.7) // Slower as RPM increases
          const newRpm = Math.min(9000, currentRpm + accelRate * deltaTime)
          return newRpm
        } else {
          // Releasing throttle - engine braking / deceleration
          // Faster decel at high RPM, slower near idle
          const rpmAboveIdle = currentRpm - 800
          if (rpmAboveIdle <= 0) {
            // At idle - add fluctuation
            const fluctuation = Math.sin(Date.now() / 500) * 30
            return Math.max(750, Math.min(850, 800 + fluctuation))
          }
          // Deceleration rate proportional to RPM above idle
          const decelRate = 1500 + (rpmAboveIdle * 0.3)
          const newRpm = Math.max(800, currentRpm - decelRate * deltaTime)
          return newRpm
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isThrottling])

  // Notify parent of RPM changes
  useEffect(() => {
    onRpmChange?.(rpm)
  }, [rpm, onRpmChange])

  // Throttle control handlers
  const handleThrottleStart = useCallback(() => {
    setIsThrottling(true)
    targetRpmRef.current = 9000
  }, [])

  const handleThrottleEnd = useCallback(() => {
    setIsThrottling(false)
    targetRpmRef.current = 800
  }, [])

  // Piston and gear animation speeds - slower at idle, faster at high RPM
  // At idle (~800 RPM): pistonSpeed ~= 1.5s (slow, smooth)
  // At redline (9000 RPM): pistonSpeed ~= 0.15s (very fast)
  const idleRpm = 800
  const maxRpm = 9000
  const rpmRange = maxRpm - idleRpm
  const normalizedRpm = Math.max(0, rpm - idleRpm) / rpmRange  // 0 at idle, 1 at redline

  const pistonSpeed = 1.5 - (normalizedRpm * 1.35)  // 1.5s at idle, 0.15s at redline
  const gearSpeed = 3 - (normalizedRpm * 2.7)  // 3s at idle, 0.3s at redline

  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
      {/* Background glow based on RPM */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at center, ${rpm > 7000 ? 'rgba(239, 68, 68, 0.3)' : rpm > 5000 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)'} 0%, transparent 60%)`,
          opacity: 0.5 + rpm / 18000
        }}
      />

      {/* Top Center - Tachometer */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <Tachometer rpm={rpm} />
      </div>

      {/* Left Side - Pistons & Gears */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4 opacity-60">
        <div className="hidden md:block">
          <GearCluster speed={gearSpeed} size="lg" id="left-cluster" />
        </div>
        <div className="scale-75 md:scale-100 -ml-4 md:ml-0">
          <PistonPair speed={pistonSpeed} rpm={rpm} />
        </div>
      </div>

      {/* Right Side - Pistons & Gears (mirrored) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4 opacity-60 scale-x-[-1]">
        <div className="hidden md:block">
          <GearCluster speed={gearSpeed} size="lg" id="right-cluster" />
        </div>
        <div className="scale-75 md:scale-100 -ml-4 md:ml-0">
          <PistonPair speed={pistonSpeed} rpm={rpm} />
        </div>
      </div>

      {/* Bottom Right - Throttle Pedal */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10">
        <ThrottlePedal
          isPressed={isThrottling}
          onPressStart={handleThrottleStart}
          onPressEnd={handleThrottleEnd}
        />
      </div>

      {/* Decorative small gears scattered */}
      <div className="absolute top-8 left-[15%] opacity-30 hidden lg:block">
        <Gear id="deco-1" size={32} speed={gearSpeed * 1.5} direction="cw" />
      </div>
      <div className="absolute top-12 right-[15%] opacity-30 hidden lg:block">
        <Gear id="deco-2" size={24} speed={gearSpeed * 1.2} direction="ccw" />
      </div>
      <div className="absolute bottom-20 left-[20%] opacity-20 hidden lg:block">
        <Gear id="deco-3" size={20} speed={gearSpeed * 0.8} direction="cw" />
      </div>
      <div className="absolute bottom-24 right-[18%] opacity-20 hidden lg:block">
        <Gear id="deco-4" size={28} speed={gearSpeed} direction="ccw" />
      </div>

      {/* Spark effects at high RPM */}
      {rpm > 5500 && <SparkEffects />}
    </div>
  )
}

// Two pistons side by side
function PistonPair({ speed, rpm }: { speed: number; rpm: number }) {
  return (
    <div className="flex gap-1">
      <Piston delay={0} speed={speed} isHot={rpm > 5000} />
      <Piston delay={0.5} speed={speed} isHot={rpm > 5000} />
    </div>
  )
}

function Piston({ delay, speed, isHot }: { delay: number; speed: number; isHot: boolean }) {
  return (
    <div className="relative">
      {/* Cylinder */}
      <div className="w-10 md:w-12 h-28 md:h-36 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-lg border border-zinc-600 relative overflow-hidden">
        {/* Cylinder head */}
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-zinc-600 to-zinc-700 border-b border-zinc-500" />

        {/* Piston head */}
        <div
          className="absolute inset-x-1 h-6 md:h-8 bg-gradient-to-b from-zinc-400 to-zinc-500 rounded-sm border border-zinc-400"
          style={{
            animationName: 'piston',
            animationDuration: `${speed}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${delay * speed}s`,
            top: '15%'
          }}
        >
          {/* Piston rings */}
          <div className="absolute inset-x-0 top-1 h-0.5 bg-zinc-600" />
          <div className="absolute inset-x-0 top-2.5 h-0.5 bg-zinc-600" />

          {/* Connecting rod */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-1.5 h-12 md:h-16 bg-gradient-to-b from-zinc-500 to-zinc-600 rounded-b" />
        </div>

        {/* Heat glow */}
        {isHot && (
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 to-transparent animate-pulse" />
        )}
      </div>

      {/* Crankcase */}
      <div className="w-10 md:w-12 h-4 bg-zinc-900 rounded-b-lg border-x border-b border-zinc-700" />
    </div>
  )
}

// Gear Cluster Component
function GearCluster({ speed, size = 'md', id = 'cluster' }: { speed: number; size?: 'sm' | 'md' | 'lg'; id?: string }) {
  const scales = { sm: 0.6, md: 1, lg: 1.3 }
  const scale = scales[size]

  return (
    <div className="relative" style={{ width: 80 * scale, height: 100 * scale }}>
      {/* Large gear */}
      <div className="absolute top-0 left-0">
        <Gear id={`${id}-lg`} size={50 * scale} speed={speed} direction="cw" />
      </div>

      {/* Medium gear */}
      <div style={{ position: 'absolute', top: 30 * scale, left: 35 * scale }}>
        <Gear id={`${id}-md`} size={35 * scale} speed={speed * 0.7} direction="ccw" />
      </div>

      {/* Small gear */}
      <div style={{ position: 'absolute', top: 55 * scale, left: 10 * scale }}>
        <Gear id={`${id}-sm`} size={25 * scale} speed={speed * 0.5} direction="cw" />
      </div>
    </div>
  )
}

function Gear({ id, size, speed, direction }: { id: string; size: number; speed: number; direction: 'cw' | 'ccw' }) {
  const teeth = Math.max(8, Math.floor(size / 5))
  const gradientId = `gear-gradient-${id}`

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        animationName: `spin${direction}`,
        animationDuration: `${speed}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite'
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
        </defs>

        {/* Teeth */}
        <g>
          {Array.from({ length: teeth }).map((_, i) => {
            const angle = (i / teeth) * 360
            return (
              <rect
                key={i}
                x="46"
                y="2"
                width="8"
                height="10"
                rx="1"
                fill={`url(#${gradientId})`}
                transform={`rotate(${angle} 50 50)`}
              />
            )
          })}
        </g>

        {/* Main circle */}
        <circle cx="50" cy="50" r="35" fill={`url(#${gradientId})`} stroke="#52525b" strokeWidth="2" />

        {/* Inner circle */}
        <circle cx="50" cy="50" r="18" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />

        {/* Center hole */}
        <circle cx="50" cy="50" r="6" fill="#18181b" />

        {/* Spokes */}
        {[0, 90, 180, 270].map((angle) => (
          <rect
            key={angle}
            x="48"
            y="22"
            width="4"
            height="12"
            rx="1"
            fill="#3f3f46"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </svg>
    </div>
  )
}

// Throttle Pedal Component
function ThrottlePedal({
  isPressed,
  onPressStart,
  onPressEnd
}: {
  isPressed: boolean
  onPressStart: () => void
  onPressEnd: () => void
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onPressStart()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    onPressStart()
  }

  return (
    <div
      className="relative select-none cursor-pointer"
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Label */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 whitespace-nowrap pointer-events-none">
        Hold to rev
      </div>

      {/* Pedal assembly */}
      <div
        className="relative w-12 h-20 md:w-14 md:h-24"
        onMouseDown={handleMouseDown}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={onPressEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Pedal mount / bracket */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 md:w-12 h-4 bg-zinc-800 rounded-b-lg border border-zinc-700" />

        {/* Pedal arm */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-b from-zinc-500 to-zinc-600 rounded transition-all duration-100 origin-bottom"
          style={{
            height: isPressed ? '40px' : '52px',
            transform: `translateX(-50%) rotate(${isPressed ? 15 : 0}deg)`
          }}
        />

        {/* Pedal pad */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-10 md:w-12 h-8 md:h-10 rounded-lg border-2 transition-all duration-100"
          style={{
            background: isPressed
              ? 'linear-gradient(to bottom, #f97316, #ea580c)'
              : 'linear-gradient(to bottom, #52525b, #3f3f46)',
            borderColor: isPressed ? '#fb923c' : '#71717a',
            top: isPressed ? '45%' : '20%',
            boxShadow: isPressed
              ? '0 2px 8px rgba(249, 115, 22, 0.5), inset 0 -2px 4px rgba(0,0,0,0.3)'
              : '0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {/* Grip texture */}
          <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-0.5 bg-black/20 rounded" />
            ))}
          </div>
        </div>

        {/* Glow effect when pressed */}
        {isPressed && (
          <div className="absolute inset-0 bg-orange-500/20 rounded-lg animate-pulse" />
        )}
      </div>
    </div>
  )
}

// Tachometer Component
function Tachometer({ rpm }: { rpm: number }) {
  const maxRpm = 9000
  const redlineStart = 7500

  // SVG center and radius
  const cx = 100
  const cy = 100
  const radius = 80

  // Arc spans from -225deg to +45deg (270 degree sweep, starting bottom-left, going clockwise through top)
  // In standard math: 0deg = right, 90deg = down, 180deg = left, 270deg = up
  // We want: start at bottom-left (-225deg or 135deg from right), end at bottom-right (+45deg)
  const startAngle = 225  // degrees from right, going counterclockwise (bottom-left)
  const endAngle = -45    // degrees (bottom-right)
  const totalSweep = 270  // degrees

  // Convert RPM to angle (0 RPM = startAngle, 9000 RPM = endAngle)
  const rpmToAngle = (rpmValue: number) => {
    const ratio = rpmValue / maxRpm
    return startAngle - (ratio * totalSweep)
  }

  // Get point on arc
  const getPoint = (angleDeg: number, r: number = radius) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad)  // Negative because SVG y is inverted
    }
  }

  // Create arc path between two angles
  const createArc = (fromAngle: number, toAngle: number, r: number = radius) => {
    const start = getPoint(fromAngle, r)
    const end = getPoint(toAngle, r)
    const sweep = fromAngle - toAngle  // How many degrees we're spanning
    const largeArc = sweep > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  // Zone boundaries (in RPM)
  const zones = [
    { from: 0, to: 5500, color: '#22c55e', opacity: 0.7 },      // Green
    { from: 5500, to: 7500, color: '#eab308', opacity: 0.7 },   // Yellow
    { from: 7500, to: 9000, color: '#ef4444', opacity: 0.9 },   // Red
  ]

  // Needle angle - round to avoid hydration mismatch from floating point differences
  const needleAngle = rpmToAngle(rpm)
  const needleEndRaw = getPoint(needleAngle, radius - 15)
  const needleEnd = {
    x: Math.round(needleEndRaw.x * 100) / 100,
    y: Math.round(needleEndRaw.y * 100) / 100,
  }

  // RPM labels (0, 1, 2, 3, 4, 5, 6, 7, 8, 9 thousand)
  const rpmLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="relative w-40 md:w-48 h-32 md:h-36">
      <svg viewBox="0 0 200 120" className="w-full h-auto">
        {/* Background arc */}
        <path
          d={createArc(startAngle, endAngle)}
          fill="none"
          stroke="#27272a"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Zone arcs */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={createArc(rpmToAngle(zone.from), rpmToAngle(zone.to))}
            fill="none"
            stroke={zone.color}
            strokeWidth="8"
            strokeLinecap="round"
            opacity={zone.opacity}
          />
        ))}

        {/* Tick marks and labels */}
        {rpmLabels.map((num) => {
          const tickAngle = rpmToAngle(num * 1000)
          const innerPoint = getPoint(tickAngle, radius - 18)
          const outerPoint = getPoint(tickAngle, radius - 8)
          const labelPoint = getPoint(tickAngle, radius - 30)
          const isRedzone = num >= 8
          const isMajor = num % 2 === 0

          return (
            <g key={num}>
              {/* Tick mark */}
              <line
                x1={innerPoint.x}
                y1={innerPoint.y}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke={isRedzone ? '#ef4444' : '#71717a'}
                strokeWidth={isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
              />
              {/* Number label */}
              {isMajor && (
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill={isRedzone ? '#ef4444' : '#a1a1aa'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {num}
                </text>
              )}
            </g>
          )
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={rpm > redlineStart ? '#ef4444' : '#f97316'}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.05s ease-out' }}
        />

        {/* Needle glow at high RPM */}
        {rpm > 5000 && (
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={rpm > redlineStart ? '#ef4444' : '#f97316'}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
            style={{ transition: 'all 0.05s ease-out' }}
          />
        )}

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="8" fill="#27272a" stroke="#f97316" strokeWidth="2" />
      </svg>

      {/* Digital RPM display below the gauge */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-xl md:text-2xl font-bold text-white tabular-nums">
          {Math.round(rpm)}
        </div>
        <div className="text-[10px] text-zinc-500 -mt-1">RPM</div>
      </div>

      {/* Redline flash effect */}
      {rpm > redlineStart && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-full" />
      )}
    </div>
  )
}

// Spark Effects
type Spark = {
  left: string
  top: string
  delay: string
  duration: string
}

const getPseudoRandom = (seed: number) => {
  const value = Math.sin(seed) * 10000
  return value - Math.floor(value)
}

function SparkEffects() {
  const sparks: Spark[] = Array.from({ length: 8 }, (_, index) => {
    const base = index * 11.37
    return {
      left: `${10 + getPseudoRandom(base + 1) * 80}%`,
      top: `${20 + getPseudoRandom(base + 2) * 50}%`,
      delay: `${getPseudoRandom(base + 3) * 0.5}s`,
      duration: `${0.3 + getPseudoRandom(base + 4) * 0.3}s`,
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparks.map((spark, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-orange-400 rounded-full"
          style={{
            left: spark.left,
            top: spark.top,
            animationName: 'spark',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: spark.delay,
            animationDuration: spark.duration,
          }}
        />
      ))}
    </div>
  )
}
