'use client'

import { useState, useEffect } from 'react'
import { Timer, Zap, TrendingUp, Trophy } from 'lucide-react'
import VerificationBadge from '@/components/ui/VerificationBadge'

interface PerformanceTime {
    id: string
    category: string
    timeMs: number
    status: 'pending' | 'approved' | 'rejected'
    runDate: string
    proofUrl: string | null
    track?: {
        name: string
    } | null
}

interface PerformanceStatsProps {
    carId: string
    showOnlyVerified?: boolean
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Timer; unit: string }> = {
    '0-100': { label: '0-100 km/h', icon: Zap, unit: 's' },
    '100-200': { label: '100-200 km/h', icon: TrendingUp, unit: 's' },
    '200-300': { label: '200-300 km/h', icon: TrendingUp, unit: 's' },
    '402m': { label: 'Quarter Mile', icon: Trophy, unit: 's' },
    '1000m': { label: '1000m', icon: Timer, unit: 's' },
}

export default function PerformanceStats({ carId, showOnlyVerified = false }: PerformanceStatsProps) {
    const [times, setTimes] = useState<PerformanceTime[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/cars/${carId}/performance`)
            .then(res => res.json())
            .then(data => {
                setTimes(data.times || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [carId])

    // Filter and get best time per category
    const bestTimes = times
        .filter(t => !showOnlyVerified || t.status === 'approved')
        .reduce((acc, time) => {
            const existing = acc[time.category]
            if (!existing || time.timeMs < existing.timeMs) {
                acc[time.category] = time
            }
            return acc
        }, {} as Record<string, PerformanceTime>)

    const displayCategories = Object.keys(CATEGORY_CONFIG).filter(cat => bestTimes[cat])

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-6 bg-zinc-800 rounded w-1/3" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-zinc-800 rounded" />
                    <div className="h-20 bg-zinc-800 rounded" />
                </div>
            </div>
        )
    }

    if (displayCategories.length === 0) {
        return null // Don't show section if no times
    }

    const formatTime = (ms: number) => {
        const seconds = ms / 1000
        return seconds.toFixed(2)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-500" />
                Performance Times
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayCategories.map(category => {
                    const time = bestTimes[category]
                    const config = CATEGORY_CONFIG[category]
                    const Icon = config.icon

                    return (
                        <div
                            key={category}
                            className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-zinc-400" />
                                <span className="text-xs text-zinc-400">{config.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">
                                    {formatTime(time.timeMs)}
                                </span>
                                <span className="text-sm text-zinc-500">{config.unit}</span>
                            </div>
                            <div className="mt-2">
                                <VerificationBadge
                                    status={time.status as 'approved' | 'pending' | 'rejected'}
                                    size="sm"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
