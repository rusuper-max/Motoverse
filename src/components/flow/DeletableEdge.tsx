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
                    className="nodrag nopan"
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(id)
                        }}
                        className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-md"
                        title="Delete connection"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    )
}
