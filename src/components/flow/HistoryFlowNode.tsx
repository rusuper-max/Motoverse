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
                className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500 rounded-full"
            />

            {/* Node Card */}
            <div className={`
                w-[280px] bg-zinc-900 rounded-xl border transition-all shadow-xl group
                ${selected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-zinc-800 hover:border-zinc-700'}
            `}>
                {/* Header Color Strip based on type */}
                <div className={`h-1.5 w-full rounded-t-xl bg-gradient-to-r ${nodeType.color}`} />

                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                            <Icon className="w-3 h-3" />
                            {nodeType.label}
                        </span>
                        {data.cost && <span className="text-xs font-medium text-green-400 font-mono">€{data.cost.toLocaleString()}</span>}
                    </div>

                    <h3 className="text-sm font-bold text-zinc-100 mb-1 line-clamp-2">{data.title}</h3>
                    <p className="text-xs text-zinc-500 mb-3">{formattedDate}</p>

                    {data.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                            {data.description}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-800/50">
                        {data.mileage && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <span className="text-zinc-600">Km:</span>
                                <span className="font-mono">{data.mileage.toLocaleString()}</span>
                            </span>
                        )}
                        {data.isLocked && <span className="text-xs ml-auto">🔒</span>}
                        {data.post && <span className="text-xs ml-auto" title="Linked to Blog Post">📝</span>}
                    </div>
                </div>

                {/* Connection Handles (Visual Only - Center Top/Bottom for vertical flows? No, stick to Left/Right for horizontal) */}
                {/* We keep the standard Handles but style them better */}
            </div>

            {/* Output Handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-500 rounded-full"
            />
        </>
    )
}

export default memo(HistoryFlowNode)
