'use client'

import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { X, Plus } from 'lucide-react'

interface CustomEdgeProps extends EdgeProps {
    onDelete?: (id: string) => void
    onInsert?: (edgeId: string, sourceId: string, targetId: string) => void
}

export default function DeletableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: CustomEdgeProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const onDelete = data?.onDelete as ((id: string) => void) | undefined
    const onInsert = data?.onInsert as ((edgeId: string, sourceId: string, targetId: string) => void) | undefined

    return (
        <g
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="react-flow__edge-interaction group"
        >
            {/* Invisible wide path for easier hovering */}
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={20}
                className="react-flow__edge-path"
            />
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.2s ease-in-out',
                        zIndex: 10,
                        display: 'flex',
                        gap: 4,
                    }}
                    className="nodrag nopan"
                >
                    {/* Insert Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onInsert?.(id, data?.source as string || '', data?.target as string || '')
                        }}
                        className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-md z-50"
                        title="Insert node here"
                    >
                        <Plus className="w-3 h-3" />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(id)
                        }}
                        className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md z-50"
                        title="Delete connection"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </g>
    )
}
