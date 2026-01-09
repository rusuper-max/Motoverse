'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, Edit3, Save, X, Gauge, Settings, Wrench, Timer, FileText, PenLine, Star, MessageSquare, Plus, History, Bell, BellOff, User, MessageCircleOff, BadgeCheck, Zap, Clock, Upload, Info, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Button from '@/components/ui/Button'
import RevLimiterRating from '@/components/ui/RevLimiterRating'
import HistoryCard from '@/components/HistoryCard'
import AddNodeModal from '@/components/AddNodeModal'
import BlogSidebar from '@/components/blog/BlogSidebar'
import CarCommentsSidebar from '@/components/CarCommentsSidebar'
import PerformanceStats from '@/components/PerformanceStats'
import PhotoAlbum from '@/components/PhotoAlbum'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface CarData {
    id: string
    year: number
    nickname: string | null
    description: string | null
    image: string | null
    mileage: number | null
    engine: string | null
    transmission: string | null
    drivetrain: string | null
    fuelType: string | null
    horsepower: number | null
    torque: number | null
    color: string | null
    // Direct make/model for API-based entry (NHTSA)
    make: string | null
    model: string | null
    // Detailed specs
    curbWeight: number | null
    weightWithDriver: number | null
    wheelSizeFront: string | null
    wheelSizeRear: string | null
    wheelBrand: string | null
    wheelModel: string | null
    wheelOffset: string | null
    tireSizeFront: string | null
    tireSizeRear: string | null
    tireBrand: string | null
    tireModel: string | null
    tireCompound: string | null
    suspensionType: string | null
    suspensionBrand: string | null
    suspensionDrop: string | null
    brakeFrontSize: string | null
    brakeRearSize: string | null
    brakeBrand: string | null
    brakeType: string | null
    modifications: string | null
    estimatedHp: number | null
    estimatedTorque: number | null
    dynoVerified: boolean
    torqueVerified: boolean
    dynoProofUrl: string | null
    commentsEnabled: boolean
    isStockPower: boolean
    engineConfig?: {
        horsepower: number | null
        torque: number | null
    } | null
    generation?: {
        name: string
        displayName: string | null
        model: {
            name: string
            make: { name: string }
        }
    }
    owner: {
        id: string
        username: string
        name: string | null
        role?: string
    }
}

interface HistoryNodeSummary {
    id: string
    type: string
    title: string
    date: string
    cost: number | null
}

interface Rating {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    user: {
        id: string
        username: string
        name: string | null
    }
}

export default function CarDetailPage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as Locale
    const carId = params.id as string
    const dict = getDictionary(locale)

    const { user, loading: authLoading } = useAuth()
    const [car, setCar] = useState<CarData | null>(null)
    const [historyNodes, setHistoryNodes] = useState<HistoryNodeSummary[]>([])
    const [ratings, setRatings] = useState<Rating[]>([])
    const [avgRating, setAvgRating] = useState(0)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'history' | 'rating'>('overview')
    const [showAddNodeModal, setShowAddNodeModal] = useState(false)

    // Rating form state
    const [myRating, setMyRating] = useState(0)
    const [myComment, setMyComment] = useState('')
    const [submittingRating, setSubmittingRating] = useState(false)

    // Car follow state
    const [isFollowingCar, setIsFollowingCar] = useState(false)
    const [carFollowerCount, setCarFollowerCount] = useState(0)
    const [togglingFollow, setTogglingFollow] = useState(false)

    // Percentile rankings
    const [percentiles, setPercentiles] = useState<{
        horsepower: number | null
        torque: number | null
        investment: number | null
    } | null>(null)

    // Form state for specs
    const [specs, setSpecs] = useState({
        curbWeight: '',
        weightWithDriver: '',
        wheelSizeFront: '',
        wheelSizeRear: '',
        wheelBrand: '',
        wheelModel: '',
        wheelOffset: '',
        tireSizeFront: '',
        tireSizeRear: '',
        tireBrand: '',
        tireModel: '',
        tireCompound: '',
        suspensionType: '',
        suspensionBrand: '',
        suspensionDrop: '',
        brakeFrontSize: '',
        brakeRearSize: '',
        brakeBrand: '',
        brakeType: '',
        modifications: '',
        estimatedHp: '',
        estimatedTorque: '',
        dynoVerified: false,
    })

    useEffect(() => {
        fetchCar()
        fetchHistoryNodes()
        fetchCarFollowStatus()
        fetchPercentiles()
    }, [carId])

    const fetchPercentiles = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/percentile`)
            if (res.ok) {
                const data = await res.json()
                setPercentiles(data)
            }
        } catch {
            // ignore
        }
    }

    const fetchCarFollowStatus = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/follow`)
            if (res.ok) {
                const data = await res.json()
                setIsFollowingCar(data.isFollowing)
                setCarFollowerCount(data.followerCount)
            }
        } catch {
            // ignore
        }
    }

    const handleToggleCarFollow = async () => {
        if (!user) return
        setTogglingFollow(true)
        try {
            const method = isFollowingCar ? 'DELETE' : 'POST'
            const res = await fetch(`/api/cars/${carId}/follow`, { method })
            if (res.ok) {
                const data = await res.json()
                setIsFollowingCar(data.isFollowing)
                setCarFollowerCount(data.followerCount)
            }
        } catch {
            // ignore
        } finally {
            setTogglingFollow(false)
        }
    }

    // Fetch ratings when user loads (to check if already rated)
    useEffect(() => {
        if (!authLoading) {
            fetchRatings()
        }
    }, [carId, authLoading, user?.id])

    const fetchHistoryNodes = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/history`)
            if (res.ok) {
                const data = await res.json()
                setHistoryNodes(data.nodes || [])
            }
        } catch {
            // ignore
        }
    }

    const fetchRatings = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/ratings`)
            if (res.ok) {
                const data = await res.json()
                setRatings(data.ratings || [])
                setAvgRating(data.average || 0)
                // Check if user already rated
                if (user) {
                    const myExistingRating = data.ratings?.find((r: { user: { id: string } }) => r.user.id === user.id)
                    if (myExistingRating) {
                        setMyRating(myExistingRating.rating)
                        setMyComment(myExistingRating.comment || '')
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    const handleSubmitRating = async () => {
        if (!myRating || myRating < 1 || myRating > 10) return
        setSubmittingRating(true)
        try {
            const res = await fetch(`/api/cars/${carId}/ratings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: myRating, comment: myComment }),
            })
            if (res.ok) {
                fetchRatings()
            }
        } catch {
            // ignore
        } finally {
            setSubmittingRating(false)
        }
    }

    const fetchCar = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setCar(data.car)
                // Initialize form with existing data
                setSpecs({
                    curbWeight: data.car.curbWeight?.toString() || '',
                    weightWithDriver: data.car.weightWithDriver?.toString() || '',
                    wheelSizeFront: data.car.wheelSizeFront || '',
                    wheelSizeRear: data.car.wheelSizeRear || '',
                    wheelBrand: data.car.wheelBrand || '',
                    wheelModel: data.car.wheelModel || '',
                    wheelOffset: data.car.wheelOffset || '',
                    tireSizeFront: data.car.tireSizeFront || '',
                    tireSizeRear: data.car.tireSizeRear || '',
                    tireBrand: data.car.tireBrand || '',
                    tireModel: data.car.tireModel || '',
                    tireCompound: data.car.tireCompound || '',
                    suspensionType: data.car.suspensionType || '',
                    suspensionBrand: data.car.suspensionBrand || '',
                    suspensionDrop: data.car.suspensionDrop || '',
                    brakeFrontSize: data.car.brakeFrontSize || '',
                    brakeRearSize: data.car.brakeRearSize || '',
                    brakeBrand: data.car.brakeBrand || '',
                    brakeType: data.car.brakeType || '',
                    modifications: data.car.modifications || '',
                    estimatedHp: data.car.estimatedHp?.toString() || '',
                    estimatedTorque: data.car.estimatedTorque?.toString() || '',
                    dynoVerified: data.car.dynoVerified || false,
                })
            } else {
                router.push(`/${locale}/garage`)
            }
        } catch {
            router.push(`/${locale}/garage`)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSpecs = async () => {
        setSaving(true)
        setError('')
        try {
            const res = await fetch(`/api/cars/${carId}/specs`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(specs),
            })
            if (res.ok) {
                const data = await res.json()
                setCar(prev => prev ? { ...prev, ...data.car } : null)
                setEditing(false)
            } else {
                const data = await res.json()
                setError(data.message || 'Failed to save specs')
            }
        } catch {
            setError('Failed to save specs')
        } finally {
            setSaving(false)
        }
    }

    const isOwner = user?.id === car?.owner?.id
    const isAdmin = user?.role && ['admin', 'founder', 'moderator'].includes(user.role)
    const canEdit = isOwner || isAdmin

    // Admin handlers for inline editing/verification
    const handleAdminVerify = async (verificationType: 'hp' | 'torque', verified: boolean) => {
        try {
            const res = await fetch(`/api/admin/cars/${carId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationType, verified }),
            })
            if (res.ok) {
                fetchCar()
            }
        } catch {
            // ignore
        }
    }

    const handleAdminEditPower = async (field: 'horsepower' | 'torque', value: number) => {
        try {
            const res = await fetch(`/api/cars/${carId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            })
            if (res.ok) {
                fetchCar()
            }
        } catch {
            // ignore
        }
    }

    const handleAdminMarkStock = async () => {
        try {
            const res = await fetch(`/api/admin/cars/${carId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationType: 'stock', verified: true }),
            })
            if (res.ok) {
                fetchCar()
            }
        } catch {
            // ignore
        }
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!car) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <p className="text-zinc-400">Car not found</p>
            </div>
        )
    }

    // Get car make/model - prefer generation-based, fallback to direct fields
    const carMakeName = car.generation?.model.make.name || car.make || ''
    const carModelName = car.generation?.model.name || car.model || ''
    const carName = car.nickname || `${carMakeName} ${carModelName}`.trim()
    const genName = car.generation?.displayName || car.generation?.name || ''

    return (
        <>
            <div className="min-h-screen pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back button */}
                    <Link
                        href={`/${locale}/garage`}
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Garage
                    </Link>

                    {/* Two Column Layout */}
                    <div className="flex gap-6">
                        {/* Main Content */}
                        <div className="flex-1 max-w-4xl">

                            {/* Hero Section */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
                                {car.image ? (
                                    <div className="aspect-video bg-zinc-800">
                                        <img src={car.image} alt={carName} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                        <Car className="w-24 h-24 text-zinc-700" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{carName}</h1>
                                            <p className="text-zinc-400 mt-1">
                                                {car.year} {carMakeName} {carModelName} {genName}
                                            </p>
                                            {/* Owner Info */}
                                            <Link
                                                href={`/${locale}/u/${car.owner.username}`}
                                                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-zinc-800/50 rounded-full hover:bg-zinc-800 transition-colors group"
                                            >
                                                <User className="w-4 h-4 text-zinc-500 group-hover:text-orange-400" />
                                                <span className="text-sm text-zinc-400 group-hover:text-white">
                                                    Owned by <span className="font-medium text-white group-hover:text-orange-400">{car.owner.name || car.owner.username}</span>
                                                </span>
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Follow Car Button - shown to logged-in non-owners */}
                                            {user && !isOwner && (
                                                <button
                                                    onClick={handleToggleCarFollow}
                                                    disabled={togglingFollow}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                                        isFollowingCar
                                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                                                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                                                    }`}
                                                >
                                                    {isFollowingCar ? (
                                                        <>
                                                            <Bell className="w-4 h-4" />
                                                            Following
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BellOff className="w-4 h-4" />
                                                            Follow Car
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {/* Show follower count */}
                                            {carFollowerCount > 0 && (
                                                <span className="text-sm text-zinc-500">
                                                    {carFollowerCount} follower{carFollowerCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {/* Owner actions */}
                                            {isOwner && (
                                                <>
                                                    <Link
                                                        href={`/${locale}/garage/${car.id}/performance`}
                                                        className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm"
                                                    >
                                                        <Timer className="w-4 h-4" />
                                                        Submit Time
                                                    </Link>
                                                    <Link
                                                        href={`/${locale}/garage/${car.id}/edit`}
                                                        className="text-orange-400 hover:text-orange-300 flex items-center gap-1 text-sm"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        Edit
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                        {car.horsepower && (
                                            <PowerStatBadge
                                                value={car.horsepower}
                                                unit="HP"
                                                isVerified={car.dynoVerified}
                                                isStock={car.isStockPower || (!car.dynoVerified && car.engineConfig?.horsepower === car.horsepower)}
                                                hasPendingProof={!!car.dynoProofUrl && !car.dynoVerified}
                                                isAdmin={!!isAdmin}
                                                verificationType="hp"
                                                onVerify={(verified) => handleAdminVerify('hp', verified)}
                                                onEdit={(value) => handleAdminEditPower('horsepower', value)}
                                                onMarkStock={handleAdminMarkStock}
                                                stockValue={car.engineConfig?.horsepower}
                                                percentile={percentiles?.horsepower}
                                            />
                                        )}
                                        {car.torque && (
                                            <PowerStatBadge
                                                value={car.torque}
                                                unit="Nm"
                                                isVerified={car.torqueVerified}
                                                isStock={car.isStockPower || (!car.torqueVerified && car.engineConfig?.torque === car.torque)}
                                                hasPendingProof={!!car.dynoProofUrl && !car.torqueVerified}
                                                isAdmin={!!isAdmin}
                                                verificationType="torque"
                                                onVerify={(verified) => handleAdminVerify('torque', verified)}
                                                onEdit={(value) => handleAdminEditPower('torque', value)}
                                                onMarkStock={handleAdminMarkStock}
                                                stockValue={car.engineConfig?.torque}
                                                percentile={percentiles?.torque}
                                            />
                                        )}
                                        {car.mileage && (
                                            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{car.mileage.toLocaleString()}</p>
                                                <p className="text-xs text-zinc-500">km</p>
                                            </div>
                                        )}
                                        {car.curbWeight && (
                                            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{car.curbWeight}</p>
                                                <p className="text-xs text-zinc-500">kg</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Performance Times */}
                                    <div className="mt-6">
                                        <PerformanceStats carId={carId} isOwner={isOwner} isAdmin={!!isAdmin} />
                                    </div>

                                    {/* Money Spent from History */}
                                    {(() => {
                                        const totalSpent = historyNodes.reduce((sum, node) => sum + (node.cost || 0), 0)
                                        if (totalSpent === 0 && historyNodes.length === 0) return null
                                        const investmentPercentile = percentiles?.investment
                                        return (
                                            <Link
                                                href={`/${locale}/garage/${car.id}/history`}
                                                className="mt-6 flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-all group cursor-pointer relative"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                        <DollarSign className="w-5 h-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-zinc-400">Total Investment</p>
                                                        <p className="text-xl font-bold text-white">
                                                            {totalSpent > 0 ? `€${totalSpent.toLocaleString()}` : 'No costs recorded'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {investmentPercentile !== null && investmentPercentile !== undefined && investmentPercentile <= 50 && totalSpent > 0 && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                                                            Top {investmentPercentile}%
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2 text-zinc-500 group-hover:text-orange-400 transition-colors">
                                                        <span className="text-sm">{historyNodes.length} event{historyNodes.length !== 1 ? 's' : ''}</span>
                                                        <History className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })()}
                                </div>
                            </div>

                            {/* Photo Album */}
                            <div className="mb-6">
                                <PhotoAlbum carId={carId} isOwner={isOwner} locale={locale} />
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 flex-wrap">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Car },
                                    { id: 'specs', label: 'Specs', icon: Gauge },
                                    { id: 'history', label: 'History', icon: History },
                                    { id: 'rating', label: `Rating ${avgRating > 0 ? `(${avgRating.toFixed(1)})` : ''}`, icon: Star },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-semibold text-white">Overview</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            {car.engine && <SpecRow label="Engine" value={car.engine} />}
                                            {car.transmission && <SpecRow label="Transmission" value={car.transmission} />}
                                            {car.drivetrain && <SpecRow label="Drivetrain" value={car.drivetrain.toUpperCase()} />}
                                            {car.fuelType && <SpecRow label="Fuel Type" value={car.fuelType} />}
                                            {car.color && <SpecRow label="Color" value={car.color} />}
                                        </div>
                                        {car.description && (
                                            <div>
                                                <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
                                                <p className="text-zinc-300">{car.description}</p>
                                            </div>
                                        )}

                                        {/* Power Verification Status */}
                                        {(car.horsepower || car.torque) && (
                                            <PowerVerificationSection
                                                car={car}
                                                isOwner={isOwner}
                                                onUpdate={fetchCar}
                                            />
                                        )}
                                    </div>
                                )}

                                {activeTab === 'specs' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-semibold text-white">Detailed Specs</h2>
                                            {isOwner && !editing && (
                                                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Edit Specs
                                                </Button>
                                            )}
                                            {editing && (
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                                                        <X className="w-4 h-4 mr-1" />
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={handleSaveSpecs} disabled={saving}>
                                                        <Save className="w-4 h-4 mr-1" />
                                                        {saving ? 'Saving...' : 'Save'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        {editing ? (
                                            <div className="space-y-8">
                                                {/* Weight Section */}
                                                <SpecSection title="Weight">
                                                    <SpecInput label="Curb Weight (kg)" value={specs.curbWeight} onChange={v => setSpecs(s => ({ ...s, curbWeight: v }))} placeholder="e.g., 1450" />
                                                    <SpecInput label="With Driver (kg)" value={specs.weightWithDriver} onChange={v => setSpecs(s => ({ ...s, weightWithDriver: v }))} placeholder="e.g., 1530" />
                                                </SpecSection>

                                                {/* Wheels Section */}
                                                <SpecSection title="Wheels">
                                                    <SpecInput label="Front Size" value={specs.wheelSizeFront} onChange={v => setSpecs(s => ({ ...s, wheelSizeFront: v }))} placeholder="e.g., 18x8.5" />
                                                    <SpecInput label="Rear Size" value={specs.wheelSizeRear} onChange={v => setSpecs(s => ({ ...s, wheelSizeRear: v }))} placeholder="e.g., 18x9.5" />
                                                    <SpecInput label="Brand" value={specs.wheelBrand} onChange={v => setSpecs(s => ({ ...s, wheelBrand: v }))} placeholder="e.g., BBS" />
                                                    <SpecInput label="Model" value={specs.wheelModel} onChange={v => setSpecs(s => ({ ...s, wheelModel: v }))} placeholder="e.g., RS-GT" />
                                                    <SpecInput label="Offset" value={specs.wheelOffset} onChange={v => setSpecs(s => ({ ...s, wheelOffset: v }))} placeholder="e.g., ET35" />
                                                </SpecSection>

                                                {/* Tires Section */}
                                                <SpecSection title="Tires">
                                                    <SpecInput label="Front Size" value={specs.tireSizeFront} onChange={v => setSpecs(s => ({ ...s, tireSizeFront: v }))} placeholder="e.g., 235/40R18" />
                                                    <SpecInput label="Rear Size" value={specs.tireSizeRear} onChange={v => setSpecs(s => ({ ...s, tireSizeRear: v }))} placeholder="e.g., 265/35R18" />
                                                    <SpecInput label="Brand" value={specs.tireBrand} onChange={v => setSpecs(s => ({ ...s, tireBrand: v }))} placeholder="e.g., Michelin" />
                                                    <SpecInput label="Model" value={specs.tireModel} onChange={v => setSpecs(s => ({ ...s, tireModel: v }))} placeholder="e.g., Pilot Sport 4S" />
                                                    <SpecSelect
                                                        label="Compound"
                                                        value={specs.tireCompound}
                                                        onChange={v => setSpecs(s => ({ ...s, tireCompound: v }))}
                                                        options={[
                                                            { value: '', label: 'Select' },
                                                            { value: 'street', label: 'Street' },
                                                            { value: 'sport', label: 'Sport' },
                                                            { value: 'semi-slick', label: 'Semi-Slick' },
                                                            { value: 'slick', label: 'Slick' },
                                                        ]}
                                                    />
                                                </SpecSection>

                                                {/* Suspension Section */}
                                                <SpecSection title="Suspension">
                                                    <SpecSelect
                                                        label="Type"
                                                        value={specs.suspensionType}
                                                        onChange={v => setSpecs(s => ({ ...s, suspensionType: v }))}
                                                        options={[
                                                            { value: '', label: 'Select' },
                                                            { value: 'stock', label: 'Stock' },
                                                            { value: 'lowering-springs', label: 'Lowering Springs' },
                                                            { value: 'coilovers', label: 'Coilovers' },
                                                            { value: 'air', label: 'Air Suspension' },
                                                        ]}
                                                    />
                                                    <SpecInput label="Brand" value={specs.suspensionBrand} onChange={v => setSpecs(s => ({ ...s, suspensionBrand: v }))} placeholder="e.g., KW" />
                                                    <SpecInput label="Drop" value={specs.suspensionDrop} onChange={v => setSpecs(s => ({ ...s, suspensionDrop: v }))} placeholder="e.g., -30mm" />
                                                </SpecSection>

                                                {/* Brakes Section */}
                                                <SpecSection title="Brakes">
                                                    <SpecInput label="Front Size" value={specs.brakeFrontSize} onChange={v => setSpecs(s => ({ ...s, brakeFrontSize: v }))} placeholder="e.g., 380mm" />
                                                    <SpecInput label="Rear Size" value={specs.brakeRearSize} onChange={v => setSpecs(s => ({ ...s, brakeRearSize: v }))} placeholder="e.g., 330mm" />
                                                    <SpecInput label="Brand" value={specs.brakeBrand} onChange={v => setSpecs(s => ({ ...s, brakeBrand: v }))} placeholder="e.g., Brembo" />
                                                    <SpecSelect
                                                        label="Type"
                                                        value={specs.brakeType}
                                                        onChange={v => setSpecs(s => ({ ...s, brakeType: v }))}
                                                        options={[
                                                            { value: '', label: 'Select' },
                                                            { value: 'stock', label: 'Stock' },
                                                            { value: 'upgraded-pads', label: 'Upgraded Pads' },
                                                            { value: 'big-brake-kit', label: 'Big Brake Kit' },
                                                        ]}
                                                    />
                                                </SpecSection>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <SpecDisplaySection title="Weight" items={[
                                                    { label: 'Curb Weight', value: car.curbWeight ? `${car.curbWeight} kg` : null },
                                                    { label: 'With Driver', value: car.weightWithDriver ? `${car.weightWithDriver} kg` : null },
                                                ]} />
                                                <SpecDisplaySection title="Wheels" items={[
                                                    { label: 'Front', value: specs.wheelSizeFront || null },
                                                    { label: 'Rear', value: specs.wheelSizeRear || null },
                                                    { label: 'Brand', value: specs.wheelBrand || null },
                                                    { label: 'Model', value: specs.wheelModel || null },
                                                ]} />
                                                <SpecDisplaySection title="Tires" items={[
                                                    { label: 'Front', value: specs.tireSizeFront || null },
                                                    { label: 'Rear', value: specs.tireSizeRear || null },
                                                    { label: 'Brand', value: specs.tireBrand || null },
                                                    { label: 'Model', value: specs.tireModel || null },
                                                    { label: 'Compound', value: specs.tireCompound || null },
                                                ]} />
                                                <SpecDisplaySection title="Suspension" items={[
                                                    { label: 'Type', value: specs.suspensionType || null },
                                                    { label: 'Brand', value: specs.suspensionBrand || null },
                                                    { label: 'Drop', value: specs.suspensionDrop || null },
                                                ]} />
                                                <SpecDisplaySection title="Brakes" items={[
                                                    { label: 'Front', value: specs.brakeFrontSize || null },
                                                    { label: 'Rear', value: specs.brakeRearSize || null },
                                                    { label: 'Brand', value: specs.brakeBrand || null },
                                                    { label: 'Type', value: specs.brakeType || null },
                                                ]} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="space-y-6">
                                        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                                            {/* Blurred history nodes preview in background */}
                                            {historyNodes.length > 0 && (
                                                <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none overflow-hidden p-4">
                                                    <div className="flex flex-col gap-3">
                                                        {historyNodes.slice(0, 5).map((node, i) => (
                                                            <div
                                                                key={node.id}
                                                                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                                                                style={{ opacity: 1 - i * 0.15 }}
                                                            >
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                    node.type === 'purchase' ? 'bg-green-500/30' :
                                                                    node.type === 'modification' ? 'bg-orange-500/30' :
                                                                    node.type === 'maintenance' ? 'bg-blue-500/30' :
                                                                    node.type === 'milestone' ? 'bg-purple-500/30' :
                                                                    'bg-zinc-700'
                                                                }`}>
                                                                    <History className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="h-3 bg-zinc-600 rounded w-3/4 mb-1" />
                                                                    <div className="h-2 bg-zinc-700 rounded w-1/2" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Main content overlay */}
                                            <div className="relative z-10 p-8 text-center bg-gradient-to-b from-zinc-900/80 via-zinc-900/90 to-zinc-900">
                                                <History className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                                                <h2 className="text-2xl font-bold text-white mb-2">Car History Timeline</h2>
                                                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                                                    View and edit your car&apos;s complete history with our visual node editor.
                                                    {historyNodes.length > 0 && ` ${historyNodes.length} events documented.`}
                                                </p>
                                                <Link href={`/${locale}/garage/${car.id}/history`}>
                                                    <Button size="lg">
                                                        <History className="w-5 h-5 mr-2" />
                                                        Open History Editor
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rating' && (
                                    <div className="space-y-6">
                                        {/* Average Rating */}
                                        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-6 border border-orange-500/30">
                                            <h2 className="text-xl font-semibold text-white mb-4">Community Rating</h2>
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <RevLimiterRating value={avgRating * 1000} readonly size="lg" />
                                                <div className="text-center sm:text-left">
                                                    <p className="text-2xl font-bold text-orange-400">{avgRating.toFixed(1)}k RPM</p>
                                                    <span className="text-zinc-400">({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rate This Car (if not owner) */}
                                        {user && !isOwner && (
                                            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    {ratings.some(r => r.user.id === user.id) ? 'Update Your Rating' : 'Rate This Car'}
                                                </h3>
                                                {ratings.some(r => r.user.id === user.id) && (
                                                    <p className="text-sm text-green-400 mb-4">You&apos;ve already rated this car. You can update your rating below.</p>
                                                )}
                                                <div className="space-y-4">
                                                    <div className="flex flex-col items-center">
                                                        <label className="block text-sm text-zinc-400 mb-4">Rev it up to rate!</label>
                                                        <RevLimiterRating
                                                            value={myRating * 1000}
                                                            onChange={(v) => setMyRating(Math.round(v / 1000))}
                                                            size="lg"
                                                        />
                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            Your rating: <span className="text-orange-400 font-semibold">{myRating}/10</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-zinc-400 mb-2">Comment (optional)</label>
                                                        <textarea
                                                            value={myComment}
                                                            onChange={(e) => setMyComment(e.target.value)}
                                                            rows={3}
                                                            className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
                                                            placeholder="Share your thoughts about this build..."
                                                        />
                                                    </div>
                                                    <Button onClick={handleSubmitRating} disabled={submittingRating || myRating === 0}>
                                                        <Star className="w-4 h-4 mr-2" />
                                                        {submittingRating ? 'Submitting...' : ratings.some(r => r.user.id === user.id) ? 'Update Rating' : 'Submit Rating'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {!user && (
                                            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 text-center">
                                                <p className="text-zinc-400 mb-4">Log in to rate this car</p>
                                                <Link href={`/${locale}/login`}>
                                                    <Button>Log In</Button>
                                                </Link>
                                            </div>
                                        )}

                                        {/* Reviews List */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">Reviews ({ratings.length})</h3>
                                            {ratings.length === 0 ? (
                                                <p className="text-zinc-500">No reviews yet. Be the first to rate this car!</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {ratings.map((rating) => (
                                                        <div key={rating.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Link href={`/${locale}/u/${rating.user.username}`} className="flex items-center gap-3 group">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:ring-2 group-hover:ring-orange-500 transition-all">
                                                                        <span className="text-xs font-bold text-white">
                                                                            {(rating.user.name || rating.user.username).charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-white font-medium group-hover:text-orange-400 transition-colors">{rating.user.name || rating.user.username}</span>
                                                                </Link>
                                                                <span className="text-sm text-zinc-500">
                                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className={`text-lg font-bold ${rating.rating >= 8 ? 'text-red-400' : 'text-orange-400'}`}>
                                                                    {rating.rating}k RPM
                                                                </span>
                                                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${rating.rating >= 8 ? 'bg-red-500' : 'bg-orange-500'}`}
                                                                        style={{ width: `${(rating.rating / 10) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {rating.comment && (
                                                                <p className="text-zinc-400 mt-3">{rating.comment}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Blog Posts */}
                        <div className="hidden lg:block w-80 shrink-0">
                            <div className="sticky top-24">
                                <BlogSidebar carId={carId} locale={locale} isOwner={isOwner} />
                            </div>
                        </div>
                    </div>

                    {/* Comments Section - Full Width Below */}
                    <div className="mt-6">
                        {/* Owner toggle for comments */}
                        {isOwner && (
                            <div className="flex items-center justify-between mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MessageCircleOff className="w-5 h-5 text-zinc-500" />
                                    <div>
                                        <p className="text-sm font-medium text-white">Comments</p>
                                        <p className="text-xs text-zinc-500">Allow visitors to comment on your car</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const res = await fetch(`/api/cars/${carId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ commentsEnabled: !car.commentsEnabled }),
                                        })
                                        if (res.ok) {
                                            setCar(prev => prev ? { ...prev, commentsEnabled: !prev.commentsEnabled } : null)
                                        }
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        car.commentsEnabled ? 'bg-orange-500' : 'bg-zinc-700'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                            car.commentsEnabled ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        )}

                        {car.commentsEnabled ? (
                            <CarCommentsSidebar
                                carId={carId}
                                locale={locale}
                                currentUser={user ? { id: user.id, avatar: user.avatar, name: user.name } : null}
                            />
                        ) : (
                            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
                                <MessageCircleOff className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-500">Comments are disabled for this car</p>
                            </div>
                        )}
                    </div>

                    {/* Add Node Modal */}
                    {showAddNodeModal && car && (
                        <AddNodeModal
                            carId={car.id}
                            onClose={() => setShowAddNodeModal(false)}
                            onSuccess={() => fetchHistoryNodes()}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

// Helper Components
function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-white capitalize">{value}</p>
        </div>
    )
}

function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 border-b border-zinc-800 pb-2">{title}</h3>
            <div className="grid grid-cols-2 gap-4">{children}</div>
        </div>
    )
}

function SpecInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
        </div>
    )
}

function SpecSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

function SpecDisplaySection({ title, items }: { title: string; items: { label: string; value: string | null }[] }) {
    const filledItems = items.filter(i => i.value)
    if (filledItems.length === 0) {
        return (
            <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
                <p className="text-zinc-600 text-sm">No data entered</p>
            </div>
        )
    }
    return (
        <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filledItems.map(item => (
                    <div key={item.label} className="bg-zinc-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-zinc-500">{item.label}</p>
                        <p className="text-white capitalize text-sm">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PowerStatBadge({ value, unit, isVerified, isStock, hasPendingProof, isAdmin, onVerify, onEdit, onMarkStock, verificationType, stockValue, percentile }: {
    value: number
    unit: string
    isVerified: boolean
    isStock: boolean
    hasPendingProof: boolean
    isAdmin?: boolean
    onVerify?: (verified: boolean) => void
    onEdit?: (newValue: number) => void
    onMarkStock?: () => void
    verificationType?: 'hp' | 'torque'
    stockValue?: number | null
    percentile?: number | null
}) {
    const [showTooltip, setShowTooltip] = useState(false)
    const [showAdminMenu, setShowAdminMenu] = useState(false)
    const [editValue, setEditValue] = useState(String(value))
    const [isEditing, setIsEditing] = useState(false)

    // Calculate percentage difference from stock
    const getDiffFromStock = () => {
        if (!stockValue || stockValue === 0 || value === stockValue) return null
        const diff = ((value - stockValue) / stockValue) * 100
        return diff
    }

    const diff = getDiffFromStock()

    const getBadgeConfig = () => {
        if (isVerified) {
            return {
                icon: BadgeCheck,
                label: 'Verified',
                bgColor: 'bg-green-500',
                tooltip: 'Power verified with dyno proof by admin'
            }
        }
        if (hasPendingProof) {
            return {
                icon: Clock,
                label: 'Pending',
                bgColor: 'bg-yellow-500',
                tooltip: 'Verification pending - dyno proof submitted'
            }
        }
        if (isStock) {
            return {
                icon: Zap,
                label: 'Stock',
                bgColor: 'bg-blue-500',
                tooltip: 'Matches factory specifications'
            }
        }
        return {
            icon: AlertCircle,
            label: 'Unverified',
            bgColor: 'bg-zinc-600',
            tooltip: 'User-reported value - not verified'
        }
    }

    const badge = getBadgeConfig()
    const Icon = badge.icon

    const handleSaveEdit = () => {
        const num = parseInt(editValue, 10)
        if (!isNaN(num) && num > 0 && onEdit) {
            onEdit(num)
        }
        setIsEditing(false)
    }

    return (
        <div
            className={`bg-zinc-800/50 rounded-lg p-3 text-center relative ${isAdmin ? 'cursor-pointer hover:bg-zinc-700/50 transition-colors' : ''}`}
            onClick={() => isAdmin && setShowAdminMenu(!showAdminMenu)}
        >
            {isEditing ? (
                <div className="flex flex-col items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-20 text-center text-xl font-bold bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white"
                        autoFocus
                    />
                    <div className="flex gap-1">
                        <button onClick={handleSaveEdit} className="text-xs bg-green-600 px-2 py-0.5 rounded text-white">Save</button>
                        <button onClick={() => setIsEditing(false)} className="text-xs bg-zinc-600 px-2 py-0.5 rounded text-white">Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-zinc-500">{unit}</p>
                    {/* Power difference indicator - bottom left */}
                    {diff !== null && (
                        <div className={`absolute -bottom-2 -left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg ${
                            diff > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                            {diff > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            {diff > 0 ? '+' : ''}{Math.round(diff)}%
                        </div>
                    )}
                    {/* Percentile badge - bottom right */}
                    {percentile !== null && percentile !== undefined && percentile <= 50 && (
                        <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg bg-purple-500 text-white">
                            Top {percentile}%
                        </div>
                    )}
                </>
            )}
            <div
                className="absolute -top-2 -right-2 cursor-help"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className={`flex items-center gap-1 px-2 py-0.5 ${badge.bgColor} text-white text-[10px] font-bold rounded-full shadow-lg`}>
                    <Icon className="w-3 h-3" />
                    {badge.label}
                </div>
                {showTooltip && !showAdminMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-xs text-zinc-300 text-left">
                        {badge.tooltip}
                        {isAdmin && <p className="mt-1 text-orange-400">Click to edit/verify</p>}
                    </div>
                )}
            </div>

            {/* Admin Menu - positioned above to avoid overflow */}
            {isAdmin && showAdminMenu && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 min-w-[160px]"
                    onClick={e => e.stopPropagation()}
                >
                    <p className="text-xs text-zinc-500 mb-2 font-medium">Admin Actions</p>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => { setIsEditing(true); setShowAdminMenu(false); }}
                            className="text-xs px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-white text-left flex items-center gap-2"
                        >
                            <Edit3 className="w-3 h-3" />
                            Edit Value
                        </button>
                        {!isVerified && onVerify && (
                            <button
                                onClick={() => { onVerify(true); setShowAdminMenu(false); }}
                                className="text-xs px-2 py-1.5 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400 text-left flex items-center gap-2"
                            >
                                <BadgeCheck className="w-3 h-3" />
                                Verify (Dyno)
                            </button>
                        )}
                        {!isStock && !isVerified && onMarkStock && (
                            <button
                                onClick={() => { onMarkStock(); setShowAdminMenu(false); }}
                                className="text-xs px-2 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-400 text-left flex items-center gap-2"
                            >
                                <Zap className="w-3 h-3" />
                                Mark as Stock
                            </button>
                        )}
                        {(isVerified || isStock) && onVerify && (
                            <button
                                onClick={() => { onVerify(false); setShowAdminMenu(false); }}
                                className="text-xs px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 text-left flex items-center gap-2"
                            >
                                <X className="w-3 h-3" />
                                Remove Badge
                            </button>
                        )}
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zinc-700" />
                </div>
            )}
        </div>
    )
}

function PowerVerificationSection({ car, isOwner, onUpdate }: { car: CarData; isOwner: boolean; onUpdate: () => void }) {
    const [uploading, setUploading] = useState(false)
    const [showUploadForm, setShowUploadForm] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()

    const isStockHp = car.engineConfig?.horsepower && car.horsepower === car.engineConfig.horsepower
    const isStockTorque = car.engineConfig?.torque && car.torque === car.engineConfig.torque
    const hasPendingProof = !!car.dynoProofUrl && !car.dynoVerified

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user?.id) return

        setUploading(true)
        try {
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const fileExt = file.name.split('.').pop()?.toLowerCase()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${user.id}/dyno/${car.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('machinebio-photos')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                alert('Failed to upload file')
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('machinebio-photos')
                .getPublicUrl(filePath)

            // Submit verification request
            const res = await fetch(`/api/cars/${car.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    dynoProofUrl: publicUrl,
                }),
            })

            if (res.ok) {
                setShowUploadForm(false)
                onUpdate()
            } else {
                const data = await res.json()
                alert(data.message || 'Failed to submit verification request')
            }
        } catch (err) {
            console.error('Failed to upload proof:', err)
            alert('Failed to upload proof file')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="border border-zinc-700 rounded-xl p-4 bg-zinc-800/30">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" />
                Power Verification
            </h3>

            <div className="space-y-3">
                {/* Current Status */}
                <div className="flex flex-wrap gap-2">
                    {car.dynoVerified ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                            <BadgeCheck className="w-4 h-4" />
                            Dyno Verified
                        </div>
                    ) : hasPendingProof ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending Verification
                        </div>
                    ) : (isStockHp || isStockTorque) ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                            <Zap className="w-4 h-4" />
                            Stock Power
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700/50 text-zinc-400 rounded-lg text-sm">
                            Not Verified
                        </div>
                    )}
                </div>

                {/* Stock values comparison */}
                {car.engineConfig && (car.engineConfig.horsepower || car.engineConfig.torque) && (
                    <div className="text-xs text-zinc-500">
                        Stock specs: {car.engineConfig.horsepower && `${car.engineConfig.horsepower} HP`}
                        {car.engineConfig.horsepower && car.engineConfig.torque && ' / '}
                        {car.engineConfig.torque && `${car.engineConfig.torque} Nm`}
                    </div>
                )}

                {/* Owner actions */}
                {isOwner && !car.dynoVerified && (
                    <>
                        {!showUploadForm ? (
                            <button
                                onClick={() => setShowUploadForm(true)}
                                className="text-sm text-orange-400 hover:text-orange-300 underline"
                            >
                                {hasPendingProof ? 'Update dyno proof' : 'Request verification with dyno proof'}
                            </button>
                        ) : (
                            <div className="mt-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                                <p className="text-sm text-zinc-300 mb-3">
                                    Upload your dyno sheet or video to get verified power figures.
                                </p>
                                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-zinc-600 cursor-pointer hover:border-orange-500 hover:bg-zinc-700/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-zinc-400 text-sm">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 text-zinc-400" />
                                            <span className="text-zinc-400 text-sm">Upload dyno proof (image/video)</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*,.pdf"
                                        className="hidden"
                                        onChange={handleProofUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <button
                                    onClick={() => setShowUploadForm(false)}
                                    className="mt-2 text-xs text-zinc-500 hover:text-zinc-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Show proof link if exists */}
                {car.dynoProofUrl && (
                    <a
                        href={car.dynoProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-400 hover:text-orange-300 underline"
                    >
                        View dyno proof →
                    </a>
                )}
            </div>
        </div>
    )
}
