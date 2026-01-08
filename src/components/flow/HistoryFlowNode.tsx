'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Key, Settings, Wrench, Paintbrush, MapPin, FileText } from 'lucide-react'

const NODE_TYPES_CONFIG: Record<string, { icon: typeof Key; label: string; color: string }> = {
    purchase: { icon: Key, label: 'Purchase', color: 'from-green-500 to-emerald-600' },
    mod_engine: { icon: Settings, label: 'Engine', color: 'from-orange-500 to-red-600' },
    mod_suspension: { icon: Wrench, label: 'Suspension', color: 'from-blue-500 to-indigo-600' },
    mod_exterior: { icon: Paintbrush, label: 'Exterior', color: 'from-purple-500 to-pink-600' },
    maintenance: { icon: Wrench, label: 'Maintenance', color: 'from-yellow-500 to-amber-600' },
    trip: { icon: MapPin, label: 'Trip', color: 'from-cyan-500 to-teal-600' },
    custom: { icon: FileText, label: 'Event', color: 'from-zinc-500 to-zinc-600' },
}

interface HistoryFlowNodeProps {
    data: {
        type: string
        title: string
        description: string | null
        date: string
        mileage: number | null
        cost: number | null
        isLocked: boolean
        post?: { id: string; title: string } | null
    }
    selected?: boolean
}

function HistoryFlowNode({ data, selected }: HistoryFlowNodeProps) {
    const nodeType = NODE_TYPES_CONFIG[data.type] || NODE_TYPES_CONFIG.custom
    const Icon = nodeType.icon

    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })

    return (
        <>
            {/* Input Handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500"
            />

            {/* Node Card */}
            <div className={`w-52 bg-zinc-900 border rounded-xl p-4 transition-all cursor-grab active:cursor-grabbing ${selected ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-zinc-800 hover:border-zinc-700'
                }`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${nodeType.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-zinc-500">{nodeType.label}</span>
                    {data.isLocked && <span className="text-xs">🔒</span>}
                    {data.post && <span className="text-xs ml-auto" title="Linked to Blog Post">📝</span>}
                </div>

                {/* Title */}
                <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{data.title}</h3>

                {/* Date */}
                <p className="text-xs text-zinc-500 mb-2">{formattedDate}</p>

                {/* Details */}
                {(data.mileage || data.cost) && (
                    <div className="flex gap-2 text-xs text-zinc-600">
                        {data.mileage && <span>{data.mileage.toLocaleString()} km</span>}
                        {data.mileage && data.cost && <span>•</span>}
                        {data.cost && <span>€{data.cost}</span>}
                    </div>
                )}
            </div>

            {/* Output Handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500"
            />
        </>
    )
}

export default memo(HistoryFlowNode)
