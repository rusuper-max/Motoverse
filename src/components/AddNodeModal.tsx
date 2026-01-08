'use client'

import { useState } from 'react'
import { X, Key, Wrench, Settings, Paintbrush, MapPin, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'

interface AddNodeModalProps {
    carId: string
    parentId?: string | null
    onClose: () => void
    onSuccess: (node?: HistoryNodeResult | null) => void
}

type HistoryNodeResult = {
    id: string
}

const NODE_TYPES = [
    { id: 'purchase', icon: Key, label: 'Purchase', color: 'from-green-500 to-emerald-600' },
    { id: 'mod_engine', icon: Settings, label: 'Engine Mod', color: 'from-orange-500 to-red-600' },
    { id: 'mod_suspension', icon: Wrench, label: 'Suspension', color: 'from-blue-500 to-indigo-600' },
    { id: 'mod_exterior', icon: Paintbrush, label: 'Exterior', color: 'from-purple-500 to-pink-600' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance', color: 'from-yellow-500 to-amber-600' },
    { id: 'trip', icon: MapPin, label: 'Road Trip', color: 'from-cyan-500 to-teal-600' },
    { id: 'custom', icon: FileText, label: 'Custom Event', color: 'from-zinc-500 to-zinc-600' },
]

export default function AddNodeModal({ carId, parentId, onClose, onSuccess }: AddNodeModalProps) {
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [mileage, setMileage] = useState('')
    const [cost, setCost] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!type) {
            setError('Please select an event type')
            return
        }
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/cars/${carId}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    title,
                    description,
                    date,
                    mileage: mileage || null,
                    cost: cost || null,
                    parentId: parentId || null,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add event')
            }

            onSuccess(data.node)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">Add History Event</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Event Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {NODE_TYPES.map((nodeType) => (
                                <button
                                    key={nodeType.id}
                                    type="button"
                                    onClick={() => setType(nodeType.id)}
                                    className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${type === nodeType.id
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-800/50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${nodeType.color} flex items-center justify-center`}>
                                        <nodeType.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className={type === nodeType.id ? 'text-white' : 'text-zinc-300'}>{nodeType.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                            placeholder="e.g., Installed coilovers"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Date *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-orange-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
                            placeholder="Add more details..."
                        />
                    </div>

                    {/* Mileage & Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Mileage (km)</label>
                            <input
                                type="number"
                                value={mileage}
                                onChange={(e) => setMileage(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-orange-500 focus:outline-none"
                                placeholder="e.g., 50000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Cost (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:border-orange-500 focus:outline-none"
                                placeholder="e.g., 1500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Adding...' : 'Add Event'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
