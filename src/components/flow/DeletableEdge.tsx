'use client'

import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { X } from 'lucide-react'

interface CustomEdgeProps extends EdgeProps {
    onDelete?: (id: string) => void
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
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const onDelete = data?.onDelete as ((id: string) => void) | undefined

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan group"
                >
                    <button
                        onClick={() => onDelete?.(id)}
                        className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    )
}
