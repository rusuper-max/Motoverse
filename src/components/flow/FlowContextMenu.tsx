'use client'

import { Key, Settings, Wrench, Paintbrush, MapPin, FileText, Trash2, Edit3, GitBranch, Copy } from 'lucide-react'

interface ContextMenuProps {
    x: number
    y: number
    nodeId?: string
    isOwner: boolean
    onClose: () => void
    onAddNode: (type: string) => void
    onEditNode?: () => void
    onDeleteNode?: () => void
    onBranchNode?: () => void
}

const NODE_TYPES = [
    { id: 'purchase', icon: Key, label: 'Purchase', color: 'from-green-500 to-emerald-600' },
    { id: 'mod_engine', icon: Settings, label: 'Engine Mod', color: 'from-orange-500 to-red-600' },
    { id: 'mod_suspension', icon: Wrench, label: 'Suspension', color: 'from-blue-500 to-indigo-600' },
    { id: 'mod_exterior', icon: Paintbrush, label: 'Exterior', color: 'from-purple-500 to-pink-600' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance', color: 'from-yellow-500 to-amber-600' },
    { id: 'trip', icon: MapPin, label: 'Road Trip', color: 'from-cyan-500 to-teal-600' },
    { id: 'custom', icon: FileText, label: 'Custom', color: 'from-zinc-500 to-zinc-600' },
]

export default function FlowContextMenu({
    x,
    y,
    nodeId,
    isOwner,
    onClose,
    onAddNode,
    onEditNode,
    onDeleteNode,
    onBranchNode,
}: ContextMenuProps) {
    if (!isOwner) return null

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Menu */}
            <div
                className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-48"
                style={{ left: x, top: y }}
            >
                {nodeId ? (
                    // Node context menu
                    <div className="py-1">
                        <button
                            onClick={() => { onEditNode?.(); onClose(); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Node
                        </button>
                        <button
                            onClick={() => { onBranchNode?.(); onClose(); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            <GitBranch className="w-4 h-4" />
                            Create Branch
                        </button>
                        <button
                            onClick={() => { onDeleteNode?.(); onClose(); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Node
                        </button>
                    </div>
                ) : (
                    // Canvas context menu - add node
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Add Event
                        </div>
                        {NODE_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => { onAddNode(type.id); onClose(); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                                <div className={`w-5 h-5 rounded bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                                    <type.icon className="w-3 h-3 text-white" />
                                </div>
                                {type.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
