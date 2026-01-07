'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Trophy, Clock, Car, Filter, ChevronDown, Star } from 'lucide-react'
import PistonRating from '@/components/ui/PistonRating'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'

interface PerformanceTime {
    id: string
    timeMs: number
    category: string
    status: string
    runDate: string
    location: string | null
    weather: string | null
    carHp: number | null
    carWeight: number | null
    proofUrl: string | null
    car: {
        id: string
        year: number
        nickname: string | null
        generation: {
            name: string
            displayName: string | null
            model: {
                name: string
                make: { name: string; slug: string }
            }
        } | null
    }
    user: {
        id: string
        username: string
        name: string | null
    }
    track: { name: string } | null
}

interface CarMake {
    id: string
    name: string
    slug: string
}

interface RatedCar {
    id: string
    year: number
    nickname: string | null
    image: string | null
    avgRating: number
    ratingCount: number
    owner: {
        id: string
        username: string
        name: string | null
    }
    generation: {
        name: string
        displayName: string | null
        model: {
            name: string
            make: { name: string; slug: string }
        }
    } | null
}

const CATEGORIES = [
    { id: 'community', label: '🏆 Community Picks', unit: '' },
    { id: '0-100', label: '0-100 km/h', unit: 's' },
    { id: '100-200', label: '100-200 km/h', unit: 's' },
    { id: '200-300', label: '200-300 km/h', unit: 's' },
    { id: '402m', label: '1/4 Mile (402m)', unit: 's' },
    { id: '1000m', label: '1/2 Mile (1000m)', unit: 's' },
    { id: 'track', label: 'Track Times', unit: '' },
]

export default function LeaderboardsPage() {
    const params = useParams()
    const locale = params.locale as Locale
    const dict = getDictionary(locale)

    const [times, setTimes] = useState<PerformanceTime[]>([])
    const [ratedCars, setRatedCars] = useState<RatedCar[]>([])
    const [makes, setMakes] = useState<CarMake[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('community')
    const [makeFilter, setMakeFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchMakes()
    }, [])

    useEffect(() => {
        fetchTimes()
    }, [category, makeFilter])

    const fetchMakes = async () => {
        try {
            const res = await fetch('/api/makes')
            if (res.ok) {
                const data = await res.json()
                setMakes(data.makes || [])
            }
        } catch {
            // ignore
        }
    }

    const fetchTimes = async () => {
        if (category === 'community') {
            fetchRatedCars()
            return
        }
        setLoading(true)
        try {
            const params = new URLSearchParams({
                category,
                status: 'approved',
                limit: '100',
            })
            if (makeFilter) params.set('make', makeFilter)

            const res = await fetch(`/api/performance?${params}`)
            if (res.ok) {
                const data = await res.json()
                setTimes(data.times || [])
            }
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    const fetchRatedCars = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ratings/leaderboard?limit=50')
            if (res.ok) {
                const data = await res.json()
                setRatedCars(data.cars || [])
            }
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (ms: number) => {
        const seconds = ms / 1000
        if (category === 'track') {
            const mins = Math.floor(seconds / 60)
            const secs = (seconds % 60).toFixed(3)
            return `${mins}:${secs.padStart(6, '0')}`
        }
        return `${seconds.toFixed(2)}s`
    }

    const currentCategory = CATEGORIES.find(c => c.id === category)

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Leaderboards</h1>
                        <p className="text-zinc-400">Community performance times</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${category === cat.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>

                    {showFilters && (
                        <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Make</label>
                                    <select
                                        value={makeFilter}
                                        onChange={e => setMakeFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white"
                                    >
                                        <option value="">All Makes</option>
                                        {makes.map(make => (
                                            <option key={make.slug} value={make.slug}>{make.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Community Picks Grid */}
                {category === 'community' && (
                    <div className="mb-8">
                        {loading ? (
                            <div className="text-center py-12 text-zinc-500">Loading...</div>
                        ) : ratedCars.length === 0 ? (
                            <div className="text-center py-12">
                                <Star className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                                <p className="text-lg font-medium text-zinc-400">No rated cars yet</p>
                                <p className="text-sm text-zinc-600">Be the first to rate a car!</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ratedCars.map((car, index) => (
                                    <Link
                                        key={car.id}
                                        href={`/${locale}/garage/${car.id}`}
                                        className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all"
                                    >
                                        {/* Rank badge */}
                                        <div className="relative">
                                            {car.image ? (
                                                <div className="aspect-video bg-zinc-800">
                                                    <img src={car.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                                    <Car className="w-12 h-12 text-zinc-700" />
                                                </div>
                                            )}
                                            <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                index === 1 ? 'bg-zinc-300 text-black' :
                                                    index === 2 ? 'bg-amber-700 text-white' :
                                                        'bg-zinc-700 text-zinc-300'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                                                {car.generation?.model.make.name} {car.generation?.model.name}
                                            </h3>
                                            <p className="text-sm text-zinc-500">
                                                {car.year} {car.generation?.displayName || car.generation?.name}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <PistonRating value={car.avgRating} readonly size="sm" />
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-2">
                                                {car.ratingCount} review{car.ratingCount !== 1 ? 's' : ''} • by @{car.owner.username}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard Table (for performance categories) */}
                {category !== 'community' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">#</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Time
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                                            <Car className="w-4 h-4 inline mr-1" />
                                            Car
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Driver</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Power</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : times.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                                <Trophy className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                                                <p className="text-lg font-medium text-zinc-400">No times yet</p>
                                                <p className="text-sm text-zinc-600">Be the first to submit a {currentCategory?.label} time!</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        times.map((time, index) => (
                                            <tr key={time.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <span className={`font-bold ${index === 0 ? 'text-yellow-400' :
                                                        index === 1 ? 'text-zinc-300' :
                                                            index === 2 ? 'text-amber-600' :
                                                                'text-zinc-500'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xl font-bold text-white">{formatTime(time.timeMs)}</span>
                                                    {time.proofUrl && (
                                                        <span className="ml-2 text-xs text-green-400">✓ Verified</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Link
                                                        href={`/${locale}/garage/${time.car.id}`}
                                                        className="hover:text-orange-400 transition-colors"
                                                    >
                                                        <p className="font-medium text-white">
                                                            {time.car.generation?.model.make.name} {time.car.generation?.model.name}
                                                        </p>
                                                        <p className="text-sm text-zinc-500">
                                                            {time.car.year} {time.car.generation?.displayName || time.car.generation?.name}
                                                        </p>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-zinc-300">{time.user.name || time.user.username}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {time.carHp ? (
                                                        <span className="text-zinc-300">{time.carHp} HP</span>
                                                    ) : (
                                                        <span className="text-zinc-600">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-zinc-500 text-sm">
                                                        {new Date(time.runDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-8 text-center">
                    <p className="text-zinc-400 mb-4">Got a fast car? Submit your times!</p>
                    <Link
                        href={`/${locale}/garage`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                    >
                        Go to Garage
                    </Link>
                </div>
            </div>
        </div>
    )
}
