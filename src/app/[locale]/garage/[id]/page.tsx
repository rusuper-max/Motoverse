'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Car, Edit3, Save, X, Gauge, Settings, Timer, History,
    Star, User, Bell, BellOff, MessageCircleOff, BadgeCheck, Zap,
    Clock, TrendingUp, TrendingDown, DollarSign, ChevronRight,
    Share2, MapPin, Calendar, Activity, BookOpen, Plus, PenLine, Upload, AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import RevLimiterRating from '@/components/ui/RevLimiterRating'
import HistoryCard from '@/components/HistoryCard'
import AddNodeModal from '@/components/AddNodeModal'
import CarCommentsSidebar from '@/components/CarCommentsSidebar'
import PerformanceStats from '@/components/PerformanceStats'
import PhotoAlbum from '@/components/PhotoAlbum'
import BlogSidebar from '@/components/blog/BlogSidebar'
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
    make: string | null
    model: string | null
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
    engineConfig?: { horsepower: number | null; torque: number | null } | null
    generation?: { name: string; displayName: string | null; model: { name: string; make: { name: string } } }
    owner: { id: string; username: string; name: string | null; role?: string; avatar?: string | null; country?: string | null }
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
    user: { id: string; username: string; name: string | null }
}

interface RankingData {
    rank: number
    total: number
    percentile: number
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
        horsepower: RankingData | null
        torque: RankingData | null
        investment: RankingData | null
        horsepowerInMake: RankingData | null
        torqueInMake: RankingData | null
        horsepowerInModel: RankingData | null
        torqueInModel: RankingData | null
        horsepowerInCountry: RankingData | null
        torqueInCountry: RankingData | null
        makeName: string | null
        modelName: string | null
        country: string | null
        totalInvestment: number
    } | null>(null)

    // Form state for specs
    const [specs, setSpecs] = useState({
        curbWeight: '', weightWithDriver: '', wheelSizeFront: '', wheelSizeRear: '',
        wheelBrand: '', wheelModel: '', wheelOffset: '', tireSizeFront: '', tireSizeRear: '',
        tireBrand: '', tireModel: '', tireCompound: '', suspensionType: '', suspensionBrand: '',
        suspensionDrop: '', brakeFrontSize: '', brakeRearSize: '', brakeBrand: '', brakeType: '',
        modifications: '', estimatedHp: '', estimatedTorque: '', dynoVerified: false,
    })

    useEffect(() => {
        fetchCar()
        fetchHistoryNodes()
        fetchCarFollowStatus()
        fetchPercentiles()
    }, [carId])

    useEffect(() => {
        if (!authLoading) fetchRatings()
    }, [carId, authLoading, user?.id])

    const fetchPercentiles = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/percentile`)
            if (res.ok) setPercentiles(await res.json())
        } catch { /* ignore */ }
    }

    const fetchCarFollowStatus = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/follow`)
            if (res.ok) {
                const data = await res.json()
                setIsFollowingCar(data.isFollowing)
                setCarFollowerCount(data.followerCount)
            }
        } catch { /* ignore */ }
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
        } catch { /* ignore */ }
        finally { setTogglingFollow(false) }
    }

    const fetchHistoryNodes = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/history`)
            if (res.ok) {
                const data = await res.json()
                setHistoryNodes(data.nodes || [])
            }
        } catch { /* ignore */ }
    }

    const fetchRatings = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/ratings`)
            if (res.ok) {
                const data = await res.json()
                setRatings(data.ratings || [])
                setAvgRating(data.average || 0)
                if (user) {
                    const myExistingRating = data.ratings?.find((r: Rating) => r.user.id === user.id)
                    if (myExistingRating) {
                        setMyRating(myExistingRating.rating)
                        setMyComment(myExistingRating.comment || '')
                    }
                }
            }
        } catch { /* ignore */ }
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
            if (res.ok) fetchRatings()
        } catch { /* ignore */ }
        finally { setSubmittingRating(false) }
    }

    const fetchCar = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setCar(data.car)
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

    const handleAdminVerify = async (verificationType: 'hp' | 'torque', verified: boolean) => {
        try {
            const res = await fetch(`/api/admin/cars/${carId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationType, verified }),
            })
            if (res.ok) fetchCar()
        } catch { /* ignore */ }
    }

    const handleAdminEditPower = async (field: 'horsepower' | 'torque', value: number) => {
        try {
            const res = await fetch(`/api/cars/${carId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            })
            if (res.ok) fetchCar()
        } catch { /* ignore */ }
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-zinc-950">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!car) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-zinc-950">
                <p className="text-zinc-400">Car not found</p>
            </div>
        )
    }

    const carMakeName = car.generation?.model.make.name || car.make || ''
    const carModelName = car.generation?.model.name || car.model || ''
    const carName = car.nickname || `${carMakeName} ${carModelName}`.trim()
    const genName = car.generation?.displayName || car.generation?.name || ''
    const totalInvestment = historyNodes.reduce((sum, node) => sum + (node.cost || 0), 0)

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-500/30">
            {/* Hero Section */}
            <div className="relative w-full h-[50vh] min-h-[400px] bg-zinc-900">
                {car.image ? (
                    <img src={car.image} alt={carName} className="w-full h-full object-cover opacity-90" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <Car className="w-24 h-24" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
                        {/* Title & Owner */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100/10 backdrop-blur border border-white/10 text-xs font-bold text-white tracking-wider uppercase">
                                    {car.year} {carMakeName}
                                </span>
                                {isOwner && (
                                    <Link
                                        href={`/${locale}/garage/${car.id}/edit`}
                                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Edit Build</span>
                                    </Link>
                                )}
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                                {carName}
                            </h1>
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                                <Link
                                    href={`/${locale}/u/${car.owner.username}`}
                                    className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group/owner"
                                >
                                    {car.owner.avatar ? (
                                        <img src={car.owner.avatar} alt={car.owner.username} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                            {car.owner.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span>Built by <span className="font-medium text-white group-hover/owner:text-orange-400 transition-colors">{car.owner.name || car.owner.username}</span></span>
                                </Link>
                                {car.owner.country && (
                                    <>
                                        <span className="text-zinc-600">•</span>
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{car.owner.country}</span>
                                        </div>
                                    </>
                                )}
                                {carFollowerCount > 0 && (
                                    <>
                                        <span className="text-zinc-600">•</span>
                                        <span className="text-zinc-400">{carFollowerCount} follower{carFollowerCount !== 1 ? 's' : ''}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions with Stats */}
                        <div className="flex items-center gap-3">
                            {/* Stats Badges */}
                            <div className="hidden sm:flex items-center gap-2 mr-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10">
                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-sm font-medium text-white">{carFollowerCount}</span>
                                </div>
                                {avgRating > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10">
                                        <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                                        <span className="text-sm font-medium text-white">{avgRating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                            {!isOwner && user && (
                                <Button
                                    className={isFollowingCar ? "bg-zinc-100 text-zinc-900 hover:bg-white" : "bg-orange-600 hover:bg-orange-500"}
                                    onClick={handleToggleCarFollow}
                                    disabled={togglingFollow}
                                >
                                    {isFollowingCar ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                                    {isFollowingCar ? 'Following' : 'Follow Build'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Spec Strip */}
            <div className="border-b border-zinc-800 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto py-4 gap-8 md:gap-12 no-scrollbar">
                        <StatStripItem label="Engine" value={car.engine} />
                        <StatStripItem label="Drivetrain" value={car.drivetrain?.toUpperCase()} />
                        <StatStripItem label="Transmission" value={car.transmission} />
                        <StatStripItem label="Weight" value={car.curbWeight ? `${car.curbWeight}kg` : null} />
                        <StatStripItem label="Mileage" value={car.mileage ? `${car.mileage.toLocaleString()}km` : null} />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Main Content) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Description */}
                        {car.description && (
                            <div className="prose prose-invert max-w-none">
                                <p className="text-zinc-300 text-lg leading-relaxed">{car.description}</p>
                            </div>
                        )}

                        {/* Tabs Navigation */}
                        <div className="border-b border-zinc-800">
                            <nav className="flex gap-6">
                                {(['overview', 'specs', 'history', 'rating'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                            ? 'border-orange-500 text-orange-400'
                                            : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SpecItem icon={Timer} label="Generation" value={genName || 'N/A'} />
                                        <SpecItem icon={Activity} label="Fuel Type" value={car.fuelType || 'N/A'} />
                                        <SpecItem icon={Calendar} label="Color" value={car.color || 'N/A'} />
                                        <SpecItem icon={DollarSign} label="Investment" value={totalInvestment > 0 ? `€${totalInvestment.toLocaleString()}` : 'No costs recorded'} sub={`${historyNodes.length} event${historyNodes.length !== 1 ? 's' : ''}`} />
                                    </div>

                                    {/* Performance Times */}
                                    <PerformanceStats carId={carId} isOwner={isOwner} isAdmin={!!isAdmin} />

                                    {/* Photo Album */}
                                    <PhotoAlbum carId={carId} isOwner={isOwner} locale={locale} />
                                </div>
                            )}

                            {activeTab === 'specs' && (
                                <div className="space-y-6">
                                    {editing ? (
                                        <SpecsEditForm
                                            specs={specs}
                                            setSpecs={setSpecs}
                                            onSave={handleSaveSpecs}
                                            onCancel={() => setEditing(false)}
                                            saving={saving}
                                            error={error}
                                        />
                                    ) : (
                                        <>
                                            {isOwner && (
                                                <div className="flex justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Edit Specs
                                                    </Button>
                                                </div>
                                            )}
                                            <SpecSection title="Wheels & Tires">
                                                <SpecRow label="Front Wheel" value={[specs.wheelBrand, specs.wheelModel, specs.wheelSizeFront].filter(Boolean).join(' ') || '-'} />
                                                <SpecRow label="Rear Wheel" value={[specs.wheelBrand, specs.wheelModel, specs.wheelSizeRear].filter(Boolean).join(' ') || '-'} />
                                                <SpecRow label="Front Tire" value={[specs.tireBrand, specs.tireSizeFront].filter(Boolean).join(' ') || '-'} />
                                                <SpecRow label="Rear Tire" value={[specs.tireBrand, specs.tireSizeRear].filter(Boolean).join(' ') || '-'} />
                                                {specs.tireCompound && <SpecRow label="Compound" value={specs.tireCompound} />}
                                            </SpecSection>
                                            <SpecSection title="Suspension & Brakes">
                                                <SpecRow label="Suspension" value={[specs.suspensionBrand, specs.suspensionType].filter(Boolean).join(' ') || '-'} />
                                                {specs.suspensionDrop && <SpecRow label="Drop" value={specs.suspensionDrop} />}
                                                <SpecRow label="Brakes" value={[specs.brakeBrand, specs.brakeType].filter(Boolean).join(' ') || '-'} />
                                            </SpecSection>
                                            <SpecSection title="Weight">
                                                <SpecRow label="Curb Weight" value={car.curbWeight ? `${car.curbWeight} kg` : '-'} />
                                                <SpecRow label="With Driver" value={car.weightWithDriver ? `${car.weightWithDriver} kg` : '-'} />
                                            </SpecSection>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        {isOwner && (
                                            <Button onClick={() => setShowAddNodeModal(true)}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Event
                                            </Button>
                                        )}
                                        <Link
                                            href={`/${locale}/garage/${carId}/history`}
                                            className="text-sm text-orange-400 hover:text-orange-300 font-medium ml-auto"
                                        >
                                            View Full History →
                                        </Link>
                                    </div>
                                    {historyNodes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                            <History className="w-12 h-12 mb-4 opacity-20" />
                                            <p>No history events yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {historyNodes.map(node => {
                                                // Format date without hours/minutes
                                                const formattedDate = node.date ? new Date(node.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : ''
                                                return (
                                                    <Link
                                                        key={node.id}
                                                        href={`/${locale}/garage/${carId}/history/${node.id}`}
                                                        className="block p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">{node.type}</span>
                                                                <h3 className="text-white font-medium mt-1">{node.title}</h3>
                                                                <p className="text-xs text-zinc-500 mt-1">{formattedDate}</p>
                                                            </div>
                                                            {node.cost && node.cost > 0 && (
                                                                <span className="text-green-400 font-medium">€{node.cost.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'rating' && (
                                <div className="space-y-6">
                                    {/* Average Rating Display */}
                                    <div className="flex items-center gap-4 p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-orange-400">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Avg Rating</div>
                                        </div>
                                        <div className="flex-1 h-px bg-zinc-800" />
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">{ratings.length}</div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Reviews</div>
                                        </div>
                                    </div>

                                    {/* Rate this car */}
                                    {user && !isOwner && (
                                        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                                            <h3 className="text-white font-bold mb-4">Rate this Build</h3>
                                            <div className="flex justify-center mb-4">
                                                <RevLimiterRating
                                                    value={myRating * 1000}
                                                    onChange={(val) => setMyRating(Math.round(val / 1000))}
                                                    size="md"
                                                />
                                            </div>
                                            <textarea
                                                value={myComment}
                                                onChange={(e) => setMyComment(e.target.value)}
                                                placeholder="Leave a comment (optional)..."
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                                                rows={3}
                                            />
                                            <Button
                                                className="w-full mt-4"
                                                onClick={handleSubmitRating}
                                                disabled={submittingRating || myRating < 1}
                                            >
                                                {submittingRating ? 'Submitting...' : 'Submit Rating'}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    {ratings.length > 0 && (
                                        <div className="space-y-3">
                                            {ratings.map(rating => (
                                                <div key={rating.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Link href={`/${locale}/u/${rating.user.username}`} className="text-white font-medium hover:text-orange-400">
                                                            {rating.user.name || rating.user.username}
                                                        </Link>
                                                        <span className="text-orange-400 font-bold">{rating.rating}/10</span>
                                                    </div>
                                                    {rating.comment && <p className="text-zinc-400 text-sm">{rating.comment}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Comments Section - Full Width */}
                            {car.commentsEnabled ? (
                                <div className="mt-8">
                                    <CarCommentsSidebar
                                        carId={carId}
                                        locale={locale}
                                        currentUser={user ? { id: user.id, avatar: user.avatar, name: user.name } : null}
                                    />
                                </div>
                            ) : (
                                <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                                    <MessageCircleOff className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-zinc-500 text-sm">Comments are disabled for this build.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-6">
                        {/* Performance Card */}
                        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                            {/* Background Effect */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                            <svg className="absolute bottom-0 left-0 right-0 w-full h-24 text-orange-500/10 pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path d="M0 40 Q 20 40, 30 30 T 50 10 T 70 5 T 100 0 V 40 H 0 Z" fill="currentColor" />
                            </svg>

                            <div className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-orange-500" />
                                        Performance
                                    </h3>
                                    {car.dynoVerified && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                                            <BadgeCheck className="w-3 h-3" />
                                            Dyno Verified
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <PowerMetric
                                        label="Horsepower"
                                        value={car.horsepower || 0}
                                        unit="HP"
                                        stock={car.engineConfig?.horsepower}
                                        verified={car.dynoVerified}
                                        hasPendingProof={!!car.dynoProofUrl && !car.dynoVerified}
                                        isStock={car.isStockPower || (!car.dynoVerified && car.engineConfig?.horsepower === car.horsepower)}
                                        ranking={percentiles?.horsepower}
                                    />
                                    <PowerMetric
                                        label="Torque"
                                        value={car.torque || 0}
                                        unit="Nm"
                                        stock={car.engineConfig?.torque}
                                        verified={car.torqueVerified}
                                        hasPendingProof={!!car.dynoProofUrl && !car.torqueVerified}
                                        isStock={car.isStockPower || (!car.torqueVerified && car.engineConfig?.torque === car.torque)}
                                        ranking={percentiles?.torque}
                                    />
                                </div>

                                {/* Admin Controls */}
                                {isAdmin && (
                                    <div className="mt-6 pt-4 border-t border-zinc-800">
                                        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase">Admin Controls</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 text-xs border border-zinc-700 bg-zinc-800/50">
                                                <Edit3 className="w-3 h-3 mr-1.5" /> Edit Values
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-xs border border-zinc-700 bg-zinc-800/50 text-green-400 hover:text-green-300"
                                                onClick={() => handleAdminVerify('hp', !car.dynoVerified)}
                                            >
                                                <BadgeCheck className="w-3 h-3 mr-1.5" /> {car.dynoVerified ? 'Unverify' : 'Verify Dyno'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner Link - Compact */}
                        <Link
                            href={`/${locale}/u/${car.owner.username}`}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            {car.owner.avatar ? (
                                <img src={car.owner.avatar} alt={car.owner.username} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold text-white">
                                    {car.owner.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{car.owner.name || car.owner.username}</h4>
                                <p className="text-xs text-zinc-500">@{car.owner.username}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </Link>

                        {/* Blog Posts */}
                        <BlogSidebar carId={carId} locale={locale} isOwner={isOwner} />
                    </div>
                </div>
            </div>

            {/* Add Node Modal */}
            {showAddNodeModal && (
                <AddNodeModal
                    carId={carId}
                    onClose={() => setShowAddNodeModal(false)}
                    onSuccess={() => { fetchHistoryNodes(); setShowAddNodeModal(false); }}
                />
            )}
        </div>
    )
}

// --- Sub-components ---

function StatStripItem({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null
    return (
        <div className="shrink-0 flex flex-col min-w-[100px]">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">{label}</span>
            <span className="text-lg text-zinc-200 font-medium whitespace-nowrap">{value}</span>
        </div>
    )
}

function SpecItem({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-zinc-200 font-medium">{value || '-'}</p>
                {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

function PowerMetric({ label, value, unit, stock, verified, hasPendingProof, isStock, ranking }: {
    label: string
    value: number
    unit: string
    stock?: number | null
    verified?: boolean
    hasPendingProof?: boolean
    isStock?: boolean
    ranking?: { rank: number; total: number; percentile: number } | null
}) {
    const diff = stock && stock > 0 ? ((value - stock) / stock) * 100 : 0
    const isGain = diff > 0

    // Get badge configuration
    const getBadge = () => {
        if (verified) {
            return { icon: BadgeCheck, label: 'Verified', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/20' }
        }
        if (hasPendingProof) {
            return { icon: Clock, label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/20' }
        }
        if (isStock) {
            return { icon: Zap, label: 'Stock', color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20' }
        }
        return { icon: AlertCircle, label: 'Unverified', color: 'text-zinc-500', bgColor: 'bg-zinc-500/10 border-zinc-500/20' }
    }

    const badge = getBadge()
    const BadgeIcon = badge.icon

    return (
        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide truncate">{label}</p>
                <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${badge.bgColor} ${badge.color}`}>
                    <BadgeIcon className="w-3 h-3 shrink-0" />
                    {badge.label}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">{value}</span>
                <span className="text-xs text-zinc-600 font-medium">{unit}</span>
            </div>
            {stock && diff !== 0 && (
                <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isGain ? '+' : ''}{Math.round(diff)}% vs Stock</span>
                </div>
            )}
            {ranking && ranking.percentile <= 50 && (
                <div className="mt-2 text-[10px] font-bold text-purple-400">
                    Top {ranking.percentile}% (#{ranking.rank} of {ranking.total})
                </div>
            )}
        </div>
    )
}

function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800/50">
                <h3 className="text-sm font-medium text-white">{title}</h3>
            </div>
            <div className="p-4 space-y-3">
                {children}
            </div>
        </div>
    )
}

function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 last:border-0 pb-2 last:pb-0">
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-300 font-medium">{value}</span>
        </div>
    )
}

function SpecsEditForm({ specs, setSpecs, onSave, onCancel, saving, error }: {
    specs: any
    setSpecs: (fn: any) => void
    onSave: () => void
    onCancel: () => void
    saving: boolean
    error: string
}) {
    const SpecInput = ({ label, value, field, placeholder }: { label: string; value: string; field: string; placeholder?: string }) => (
        <div>
            <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => setSpecs((s: any) => ({ ...s, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
            />
        </div>
    )

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <SpecInput label="Front Wheel Size" value={specs.wheelSizeFront} field="wheelSizeFront" placeholder="e.g., 18x8.5" />
                <SpecInput label="Rear Wheel Size" value={specs.wheelSizeRear} field="wheelSizeRear" placeholder="e.g., 18x9.5" />
                <SpecInput label="Wheel Brand" value={specs.wheelBrand} field="wheelBrand" placeholder="e.g., BBS" />
                <SpecInput label="Wheel Model" value={specs.wheelModel} field="wheelModel" placeholder="e.g., RS-GT" />
                <SpecInput label="Front Tire Size" value={specs.tireSizeFront} field="tireSizeFront" placeholder="e.g., 235/40R18" />
                <SpecInput label="Rear Tire Size" value={specs.tireSizeRear} field="tireSizeRear" placeholder="e.g., 265/35R18" />
                <SpecInput label="Tire Brand" value={specs.tireBrand} field="tireBrand" placeholder="e.g., Michelin" />
                <SpecInput label="Tire Model" value={specs.tireModel} field="tireModel" placeholder="e.g., Pilot Sport 4S" />
                <SpecInput label="Suspension Brand" value={specs.suspensionBrand} field="suspensionBrand" placeholder="e.g., KW" />
                <SpecInput label="Suspension Type" value={specs.suspensionType} field="suspensionType" placeholder="e.g., Coilovers" />
                <SpecInput label="Suspension Drop" value={specs.suspensionDrop} field="suspensionDrop" placeholder="e.g., -30mm" />
                <SpecInput label="Brake Brand" value={specs.brakeBrand} field="brakeBrand" placeholder="e.g., Brembo" />
            </div>

            <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={onCancel}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                </Button>
                <Button onClick={onSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Specs'}
                </Button>
            </div>
        </div>
    )
}
