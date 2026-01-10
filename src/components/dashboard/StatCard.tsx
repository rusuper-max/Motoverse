'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'orange' | 'red' | 'green' | 'blue' | 'purple' | 'yellow'
  href?: string
  onClick?: () => void
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  color = 'orange',
}: StatCardProps) {
  const colorClasses = {
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      icon: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      glow: 'shadow-green-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
    },
  }

  const colors = colorClasses[color]

  return (
    <div
      className={`relative p-4 rounded-xl border ${colors.bg} ${colors.border} hover:shadow-lg ${colors.glow} transition-all duration-300 group`}
    >
      {/* Dashboard Light Effect */}
      <div className="absolute top-3 right-3">
        <div className={`w-2 h-2 rounded-full ${colors.icon.replace('text-', 'bg-')} animate-pulse`} />
      </div>

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{value}</p>
          {subValue && (
            <p className="text-sm text-zinc-400 mt-0.5">{subValue}</p>
          )}
          {trend && trendValue && (
            <p className={`text-xs mt-1 ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan" />
      </div>
    </div>
  )
}
