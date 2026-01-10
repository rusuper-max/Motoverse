'use client'

import { useEffect, useState } from 'react'

interface GaugeWidgetProps {
  value: number
  maxValue: number
  label: string
  unit?: string
  color?: 'orange' | 'red' | 'green' | 'blue' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function GaugeWidget({
  value,
  maxValue,
  label,
  unit = '',
  color = 'orange',
  size = 'md',
  animated = true,
}: GaugeWidgetProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value)

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value)
      return
    }

    const duration = 1000
    const steps = 30
    const stepValue = value / steps
    const stepDuration = duration / steps
    let current = 0

    const interval = setInterval(() => {
      current += 1
      setDisplayValue(Math.min(stepValue * current, value))
      if (current >= steps) clearInterval(interval)
    }, stepDuration)

    return () => clearInterval(interval)
  }, [value, animated])

  const percentage = Math.min((displayValue / maxValue) * 100, 100)
  const rotation = (percentage / 100) * 180 - 90 // -90 to 90 degrees

  const colorClasses = {
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-red-700',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
  }

  const glowClasses = {
    orange: 'shadow-orange-500/50',
    red: 'shadow-red-500/50',
    green: 'shadow-green-500/50',
    blue: 'shadow-blue-500/50',
    purple: 'shadow-purple-500/50',
  }

  const sizeClasses = {
    sm: 'w-24 h-12',
    md: 'w-32 h-16',
    lg: 'w-40 h-20',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Gauge Container */}
      <div className={`relative ${sizeClasses[size]} overflow-hidden`}>
        {/* Gauge Background */}
        <div className="absolute inset-0 bg-zinc-800 rounded-t-full border-4 border-zinc-700" />

        {/* Gauge Fill */}
        <div
          className="absolute inset-0 rounded-t-full overflow-hidden"
          style={{
            clipPath: `polygon(50% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%)`,
          }}
        >
          <div
            className={`absolute bottom-0 left-1/2 w-full h-full origin-bottom bg-gradient-to-r ${colorClasses[color]}`}
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              clipPath: `polygon(50% 100%, 0% 0%, 100% 0%)`,
            }}
          />
        </div>

        {/* Center Circle */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 rounded-full border-2 border-zinc-600 z-10" />

        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-300"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            height: size === 'lg' ? '70px' : size === 'md' ? '55px' : '40px',
          }}
        >
          <div className={`w-1 h-full bg-gradient-to-t ${colorClasses[color]} rounded-full shadow-lg ${glowClasses[color]}`} />
        </div>
      </div>

      {/* Value Display */}
      <div className="mt-2 text-center">
        <span className={`font-bold font-mono text-white ${textSizes[size]}`}>
          {Math.round(displayValue).toLocaleString()}
        </span>
        {unit && <span className="text-zinc-400 ml-1 text-sm">{unit}</span>}
      </div>
      <span className="text-zinc-500 text-xs uppercase tracking-wider">{label}</span>
    </div>
  )
}
