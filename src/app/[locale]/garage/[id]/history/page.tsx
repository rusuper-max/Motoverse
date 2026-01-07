'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Car, User, Calendar, Gauge, Key, Settings, Wrench, Paintbrush, MapPin, FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import AddNodeModal from '@/components/AddNodeModal'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface HistoryNode {
    id: string
    type: string
    title: string
    description: string | null
    date: string
    mileage: number | null
    cost: number | null
    isLocked: boolean
    author: { username: string; name: string | null }
}

interface CarData {
    id: string
    year: number
    nickname: string | null
    image: string | null
    ownerId: string
    owner: { id: string; username: string; name: string | null }
    generation?: {
        name: string
        displayName: string | null
        model: { name: string; make: { name: string } }
    }
}

const NODE_TYPES: Record<string, { icon: typeof Key; label: string; color: string }> = {
    purchase: { icon: Key, label: 'Purchase', color: 'from-green-500 to-emerald-600' },
    mod_engine: { icon: Settings, label: 'Engine', color: 'from-orange-500 to-red-600' },
    mod_suspension: { icon: Wrench, label: 'Suspension', color: 'from-blue-500 to-indigo-600' },
    mod_exterior: { icon: Paintbrush, label: 'Exterior', color: 'from-purple-500 to-pink-600' },
    maintenance: { icon: Wrench, label: 'Maintenance', color: 'from-yellow-500 to-amber-600' },
    trip: { icon: MapPin, label: 'Trip', color: 'from-cyan-500 to-teal-600' },
    custom: { icon: FileText, label: 'Event', color: 'from-zinc-500 to-zinc-600' },
}

export default function HistoryPage() {
    const params = useParams()
    const locale = params.locale as Locale
    const carId = params.id as string
    const dict = getDictionary(locale)

    const { user } = useAuth()
    const [car, setCar] = useState<CarData | null>(null)
    const [nodes, setNodes] = useState<HistoryNode[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const canvasRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    const isOwner = user?.id === car?.ownerId

    useEffect(() => {
        fetchCar()
        fetchNodes()
    }, [carId])

    const fetchCar = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}`)
            if (res.ok) {
                const data = await res.json()
                setCar(data.car)
            }
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }

    const fetchNodes = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/history`)
            if (res.ok) {
                const data = await res.json()
                setNodes(data.nodes || [])
            }
        } catch { /* ignore */ }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click
            isDragging.current = true
            lastPos.current = { x: e.clientX, y: e.clientY }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - lastPos.current.x
            const dy = e.clientY - lastPos.current.y
            setPan(p => ({ x: p.x + dx, y: p.y + dy }))
            lastPos.current = { x: e.clientX, y: e.clientY }
        }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    const resetView = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!car) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-zinc-400">Car not found</p>
            </div>
        )
    }

    const carName = `${car.generation?.model.make.name || ''} ${car.generation?.model.name || ''}`
    const genName = car.generation?.displayName || car.generation?.name || ''

    return (
        <div className="h-screen flex overflow-hidden pt-16">
            {/* Sidebar */}
            <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                {/* Back button */}
                <div className="p-4 border-b border-zinc-800">
                    <Link
                        href={`/${locale}/garage/${carId}`}
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Car
                    </Link>
                </div>

                {/* Car Info */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {car.image ? (
                        <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                            <img src={car.image} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-video rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Car className="w-12 h-12 text-zinc-700" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-xl font-bold text-white">{car.nickname || carName}</h1>
                        <p className="text-zinc-400">{car.year} {genName}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <User className="w-4 h-4" />
                            <span>@{car.owner.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            <span>{nodes.length} events</span>
                        </div>
                    </div>

                    {/* Add Event Button */}
                    {isOwner && (
                        <Button onClick={() => setShowAddModal(true)} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                        </Button>
                    )}
                </div>

                {/* Zoom Controls */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center text-sm text-zinc-400">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={resetView}
                            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 bg-zinc-950 history-grid-bg overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="h-full p-8"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'left center',
                    }}
                >
                    {/* Empty state */}
                    {nodes.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <Gauge className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-500 text-lg">No history yet</p>
                                <p className="text-zinc-600 text-sm">Add events to document this car&apos;s journey</p>
                            </div>
                        </div>
                    ) : (
                        /* Horizontal Node Timeline */
                        <div className="flex items-center gap-0 py-20">
                            {nodes.map((node, index) => {
                                const nodeType = NODE_TYPES[node.type] || NODE_TYPES.custom
                                const Icon = nodeType.icon
                                const formattedDate = new Date(node.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })

                                return (
                                    <div key={node.id} className="flex items-center">
                                        {/* Connector line before (except first) */}
                                        {index > 0 && (
                                            <div className="w-16 h-0.5 bg-gradient-to-r from-zinc-700 to-zinc-600" />
                                        )}

                                        {/* Node */}
                                        <div className="group relative">
                                            {/* Card */}
                                            <div className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all hover:scale-105 cursor-pointer">
                                                {/* Header */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${nodeType.color} flex items-center justify-center`}>
                                                        <Icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-xs text-zinc-500">{nodeType.label}</span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{node.title}</h3>

                                                {/* Date */}
                                                <p className="text-xs text-zinc-500">{formattedDate}</p>

                                                {/* Details on hover */}
                                                <div className="absolute left-0 right-0 -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
                                                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 mt-2 shadow-xl">
                                                        {node.description && (
                                                            <p className="text-zinc-300 text-xs mb-2 line-clamp-3">{node.description}</p>
                                                        )}
                                                        <div className="flex gap-3 text-xs text-zinc-500">
                                                            {node.mileage && <span>{node.mileage.toLocaleString()} km</span>}
                                                            {node.cost && <span>€{node.cost}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connector line after (except last) */}
                                        {index < nodes.length - 1 && (
                                            <div className="w-16 h-0.5 bg-gradient-to-r from-zinc-600 to-zinc-700" />
                                        )}
                                    </div>
                                )
                            })}

                            {/* Add new node button at end */}
                            {isOwner && (
                                <>
                                    <div className="w-16 h-0.5 bg-gradient-to-r from-zinc-700 to-zinc-800" />
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:border-orange-500 hover:text-orange-500 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Node Modal */}
            {showAddModal && (
                <AddNodeModal
                    carId={carId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchNodes()
                        setShowAddModal(false)
                    }}
                />
            )}
        </div>
    )
}
