'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, Edit3, Save, X, Gauge, Settings, Wrench, Timer, FileText, PenLine, Star, MessageSquare, Plus, History } from 'lucide-react'
import Button from '@/components/ui/Button'
import PistonRating from '@/components/ui/PistonRating'
import HistoryCard from '@/components/HistoryCard'
import AddNodeModal from '@/components/AddNodeModal'
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
    const [historyNodes, setHistoryNodes] = useState<any[]>([])
    const [ratings, setRatings] = useState<any[]>([])
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
        fetchRatings()
    }, [carId])

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

    const carName = car.nickname || `${car.generation?.model.make.name} ${car.generation?.model.name}`
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
                                                {car.year} {car.generation?.model.make.name} {car.generation?.model.name} {genName}
                                            </p>
                                        </div>
                                        {isOwner && (
                                            <div className="flex items-center gap-3">
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
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                        {car.horsepower && (
                                            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{car.horsepower}</p>
                                                <p className="text-xs text-zinc-500">HP</p>
                                            </div>
                                        )}
                                        {car.torque && (
                                            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{car.torque}</p>
                                                <p className="text-xs text-zinc-500">Nm</p>
                                            </div>
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
                                </div>
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
                                        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center">
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
                                )}

                                {activeTab === 'rating' && (
                                    <div className="space-y-6">
                                        {/* Average Rating */}
                                        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-6 border border-orange-500/30">
                                            <h2 className="text-xl font-semibold text-white mb-4">Community Rating</h2>
                                            <div className="flex items-center gap-4">
                                                <PistonRating value={avgRating} readonly size="lg" />
                                                <span className="text-zinc-400">({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
                                            </div>
                                        </div>

                                        {/* Rate This Car (if not owner) */}
                                        {user && !isOwner && (
                                            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                                                <h3 className="text-lg font-semibold text-white mb-4">Rate This Car</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-zinc-400 mb-2">Your Rating</label>
                                                        <PistonRating value={myRating} onChange={setMyRating} size="md" />
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
                                                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
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
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                                                        <span className="text-xs font-bold text-white">
                                                                            {(rating.user.name || rating.user.username).charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-white font-medium">{rating.user.name || rating.user.username}</span>
                                                                </div>
                                                                <span className="text-sm text-zinc-500">
                                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <PistonRating value={rating.rating} readonly size="sm" />
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

                        {/* Blog Sidebar */}
                        <div className="hidden lg:block w-80 shrink-0">
                            <div className="sticky top-24">
                                <BlogSidebar carId={carId} locale={locale} isOwner={isOwner} />
                            </div>
                        </div>
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
