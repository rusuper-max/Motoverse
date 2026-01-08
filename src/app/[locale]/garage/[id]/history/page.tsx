'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Car, User, Calendar, Save, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import HistoryFlowNode from '@/components/flow/HistoryFlowNode'
import FlowContextMenu from '@/components/flow/FlowContextMenu'
import AddNodeModal from '@/components/AddNodeModal'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

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

interface HistoryNodeData {
    id: string
    type: string
    title: string
    description: string | null
    date: string
    mileage: number | null
    cost: number | null
    isLocked: boolean
    positionX: number
    positionY: number
    parentId: string | null
}

// Custom node types for React Flow
const nodeTypes = {
    historyNode: HistoryFlowNode,
}

export default function HistoryPage() {
    const params = useParams()
    const locale = params.locale as Locale
    const carId = params.id as string

    const { user } = useAuth()
    const [car, setCar] = useState<CarData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])

    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
                const historyNodes: HistoryNodeData[] = data.nodes || []

                // Convert to React Flow nodes
                const flowNodes = historyNodes.map((node, index) => ({
                    id: node.id,
                    type: 'historyNode' as const,
                    position: {
                        x: node.positionX || index * 280,
                        y: node.positionY || 100
                    },
                    data: {
                        type: node.type,
                        title: node.title,
                        description: node.description,
                        date: node.date,
                        mileage: node.mileage,
                        cost: node.cost,
                        isLocked: node.isLocked,
                    },
                }))

                // Create edges from parent relationships
                const flowEdges = historyNodes
                    .filter(node => node.parentId)
                    .map(node => ({
                        id: `e-${node.parentId}-${node.id}`,
                        source: node.parentId!,
                        target: node.id,
                        type: 'smoothstep' as const,
                        style: { stroke: '#52525b', strokeWidth: 2 },
                    }))

                // Also connect nodes sequentially if no parent is specified
                const nodesWithoutParent = historyNodes.filter(n => !n.parentId)
                for (let i = 1; i < nodesWithoutParent.length; i++) {
                    const alreadyConnected = flowEdges.some(e => e.target === nodesWithoutParent[i].id)
                    if (!alreadyConnected) {
                        flowEdges.push({
                            id: `e-${nodesWithoutParent[i - 1].id}-${nodesWithoutParent[i].id}`,
                            source: nodesWithoutParent[i - 1].id,
                            target: nodesWithoutParent[i].id,
                            type: 'smoothstep' as const,
                            style: { stroke: '#52525b', strokeWidth: 2 },
                        })
                    }
                }

                setNodes(flowNodes)
                setEdges(flowEdges)
            }
        } catch { /* ignore */ }
    }

    const onConnect = useCallback((connection: any) => {
        setEdges((eds: any) => addEdge({
            ...connection,
            type: 'smoothstep',
            style: { stroke: '#52525b', strokeWidth: 2 },
        }, eds))
    }, [setEdges])

    const savePositions = async () => {
        setSaving(true)
        try {
            await Promise.all(
                nodes.map((node: any) =>
                    fetch(`/api/cars/${carId}/history/${node.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            positionX: node.position.x,
                            positionY: node.position.y,
                        }),
                    })
                )
            )
        } catch (err) {
            console.error('Failed to save positions:', err)
        } finally {
            setSaving(false)
        }
    }

    // Autosave single node position when dragging stops
    const onNodeDragStop = useCallback((_event: any, node: any) => {
        if (!isOwner) return

        // Debounce to avoid too many API calls
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await fetch(`/api/cars/${carId}/history/${node.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        positionX: node.position.x,
                        positionY: node.position.y,
                    }),
                })
            } catch (err) {
                console.error('Failed to autosave position:', err)
            }
        }, 300)
    }, [carId, isOwner])

    const handleContextMenu = useCallback((event: any, node?: any) => {
        event.preventDefault()
        if (!isOwner) return

        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            nodeId: node?.id,
        })
    }, [isOwner])

    const handlePaneClick = useCallback(() => {
        setContextMenu(null)
    }, [])

    const handleAddNode = useCallback((type: string) => {
        setShowAddModal(true)
        setContextMenu(null)
    }, [])

    const handleDeleteNode = useCallback(async () => {
        if (!contextMenu?.nodeId) return

        try {
            const res = await fetch(`/api/cars/${carId}/history/${contextMenu.nodeId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setNodes((nds: any) => nds.filter((n: any) => n.id !== contextMenu.nodeId))
                setEdges((eds: any) => eds.filter((e: any) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId))
            }
        } catch (err) {
            console.error('Failed to delete node:', err)
        }
        setContextMenu(null)
    }, [contextMenu, carId, setNodes, setEdges])

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
                        <>
                            <Button onClick={() => setShowAddModal(true)} className="w-full">
                                Add Event
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={savePositions}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Layout
                            </Button>
                        </>
                    )}
                </div>

                {/* Instructions */}
                <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
                    <p className="mb-1"><strong>Tips:</strong></p>
                    <ul className="space-y-1">
                        <li>• Drag nodes to reposition</li>
                        <li>• Right-click for options</li>
                        <li>• Scroll to zoom</li>
                        <li>• Positions save automatically</li>
                    </ul>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div ref={reactFlowWrapper} className="flex-1 bg-zinc-950">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={handlePaneClick}
                    onNodeContextMenu={handleContextMenu}
                    onPaneContextMenu={handleContextMenu}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        style: { stroke: '#52525b', strokeWidth: 2 },
                    }}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="#27272a"
                    />
                    <Controls className="!bg-zinc-800 !border-zinc-700 !rounded-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700" />
                    <MiniMap
                        className="!bg-zinc-900 !border-zinc-800"
                        nodeColor="#52525b"
                        maskColor="rgba(0,0,0,0.7)"
                    />
                    <Panel position="top-right" className="bg-zinc-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-800">
                        <span className="text-xs text-zinc-400">
                            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
                        </span>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <FlowContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeId={contextMenu.nodeId}
                    isOwner={isOwner}
                    onClose={() => setContextMenu(null)}
                    onAddNode={handleAddNode}
                    onEditNode={() => { }}
                    onDeleteNode={handleDeleteNode}
                    onBranchNode={() => { }}
                />
            )}

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
