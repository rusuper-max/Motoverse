'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Timer, Zap, TrendingUp, Trophy, Plus, CheckCircle, X, ExternalLink } from 'lucide-react'
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
    rankings?: {
        global: { rank: number; total: number }
        make: { rank: number; total: number; name: string } | null
        model: { rank: number; total: number; name: string } | null
    } | null
}

interface PerformanceStatsProps {
    carId: string
    showOnlyVerified?: boolean
    isOwner?: boolean
    isAdmin?: boolean
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Timer; unit: string }> = {
    '0-100': { label: '0-100 km/h', icon: Zap, unit: 's' },
    '100-200': { label: '100-200 km/h', icon: TrendingUp, unit: 's' },
    '200-300': { label: '200-300 km/h', icon: TrendingUp, unit: 's' },
    '402m': { label: 'Quarter Mile', icon: Trophy, unit: 's' },
    '1000m': { label: '1000m', icon: Timer, unit: 's' },
}

export default function PerformanceStats({ carId, showOnlyVerified = false, isOwner = false, isAdmin = false }: PerformanceStatsProps) {
    const params = useParams()
    const locale = params?.locale || 'en'
    const [times, setTimes] = useState<PerformanceTime[]>([])
    const [loading, setLoading] = useState(true)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)

    const fetchTimes = () => {
        fetch(`/api/cars/${carId}/performance`)
            .then(res => res.json())
            .then(data => {
                setTimes(data.times || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchTimes()
    }, [carId])

    const handleAdminVerify = async (timeId: string, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch(`/api/admin/performance/${timeId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                fetchTimes()
                setActiveMenu(null)
            }
        } catch {
            // ignore
        }
    }

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
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Timer className="w-5 h-5 text-orange-500" />
                    Performance Times
                </h3>
                {isOwner && (
                    <Link
                        href={`/${locale}/garage/${carId}/performance`}
                        className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Time
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayCategories.map(category => {
                    const time = bestTimes[category]
                    const config = CATEGORY_CONFIG[category]
                    const Icon = config.icon
                    const showMenu = activeMenu === time.id

                    return (
                        <div
                            key={category}
                            className={`bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 relative ${isAdmin ? 'cursor-pointer hover:border-zinc-600' : ''}`}
                            onClick={() => isAdmin && setActiveMenu(showMenu ? null : time.id)}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-zinc-400" />
                                <span className="text-xs text-zinc-400">{config.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white font-mono">
                                    {formatTime(time.timeMs)}
                                </span>
                                <span className="text-sm text-zinc-500">{config.unit}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <VerificationBadge
                                    status={time.status as 'approved' | 'pending' | 'rejected'}
                                    size="sm"
                                />
                                {isAdmin && time.status === 'pending' && (
                                    <span className="text-xs text-orange-400">Click to verify</span>
                                )}
                            </div>

                            {/* Rankings */}
                            {time.rankings && (
                                <div className="mt-2 group/rank relative">
                                    <p className="text-[10px] font-bold text-purple-400 cursor-help">
                                        #{time.rankings.global.rank} Global
                                    </p>
                                    {/* Hover tooltip for make/model rankings */}
                                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover/rank:block z-50">
                                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 text-xs whitespace-nowrap">
                                            <p className="text-zinc-300 font-medium mb-1">#{time.rankings.global.rank} of {time.rankings.global.total}</p>
                                            {time.rankings.make && (
                                                <p className="text-purple-400">#{time.rankings.make.rank} in {time.rankings.make.name}</p>
                                            )}
                                            {time.rankings.model && (
                                                <p className="text-orange-400">#{time.rankings.model.rank} in {time.rankings.model.name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Menu */}
                            {isAdmin && showMenu && (
                                <div
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 min-w-[180px]"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <p className="text-xs text-zinc-500 mb-2 font-medium">Admin Actions</p>

                                    {time.proofUrl && (
                                        <a
                                            href={time.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-blue-400 mb-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            View Proof
                                        </a>
                                    )}

                                    <div className="flex flex-col gap-1">
                                        {time.status !== 'approved' && (
                                            <button
                                                onClick={() => handleAdminVerify(time.id, 'approved')}
                                                className="flex items-center gap-2 text-xs px-2 py-1.5 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                Approve
                                            </button>
                                        )}
                                        {time.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleAdminVerify(time.id, 'rejected')}
                                                className="flex items-center gap-2 text-xs px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                                Reject
                                            </button>
                                        )}
                                    </div>

                                    {/* Arrow pointing down */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zinc-700" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
