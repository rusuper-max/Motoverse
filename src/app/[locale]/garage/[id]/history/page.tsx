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
    BackgroundVariant,
    Panel,
    type Node,
    type Edge,
    type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Car, User, Calendar, Save, Loader2, DollarSign, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import HistoryFlowNode from '@/components/flow/HistoryFlowNode'
import DeletableEdge from '@/components/flow/DeletableEdge'
import FlowContextMenu from '@/components/flow/FlowContextMenu'
import AddNodeModal from '@/components/AddNodeModal'
import EditNodeModal from '@/components/EditNodeModal'
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
    post?: {
        id: string
        title: string
        thumbnail: string | null
    } | null
}

interface HistoryFlowNodeData {
    type: string
    title: string
    description: string | null
    date: string
    mileage: number | null
    cost: number | null
    isLocked: boolean
    post?: {
        id: string
        title: string
        thumbnail: string | null
    } | null
}

interface HistoryEdgeData {
    onDelete: (edgeId: string) => void
    onInsert: (edgeId: string, sourceId: string, targetId: string) => void
    source: string
    target: string
}

interface PopupData {
    x: number
    y: number
    post: { id: string; title: string; thumbnail: string | null }
}

type HistoryFlowNode = Node<HistoryFlowNodeData>
type HistoryFlowEdge = Edge<HistoryEdgeData>
type CreatedNode = { id: string }

// Custom node types for React Flow
const nodeTypes = {
    historyNode: HistoryFlowNode,
}

// Custom edge types with delete button
const edgeTypes = {
    deletable: DeletableEdge,
}

const getEventClientPoint = (event: MouseEvent | TouchEvent) => {
    if ('clientX' in event) {
        return { x: event.clientX, y: event.clientY }
    }

    const touch = event.changedTouches[0]
    return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 }
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
    const [hasChanges, setHasChanges] = useState(false)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
    const [showCostBreakdown, setShowCostBreakdown] = useState(false)
    const [rawNodes, setRawNodes] = useState<HistoryNodeData[]>([])
    const [pendingConnection, setPendingConnection] = useState<{ x: number; y: number } | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)
    const [editingNode, setEditingNode] = useState<HistoryNodeData | null>(null)
    const [insertionContext, setInsertionContext] = useState<{ parentId: string; childId: string } | null>(null)
    const [popupData, setPopupData] = useState<PopupData | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState<HistoryFlowNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<HistoryFlowEdge>([])

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
                const flowNodes: HistoryFlowNode[] = historyNodes.map((node, index) => ({
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
                        post: node.post,
                    },
                }))

                // Create edges from parent relationships
                const flowEdges: HistoryFlowEdge[] = historyNodes
                    .filter(node => node.parentId)
                    .map(node => ({
                        id: `e-${node.parentId}-${node.id}`,
                        source: node.parentId!,
                        target: node.id,
                        type: 'deletable' as const,
                        style: { stroke: '#52525b', strokeWidth: 2 },
                        data: {
                            onDelete: deleteEdgeRef.current,
                            onInsert: insertNodeRef.current,
                            source: node.parentId!,
                            target: node.id
                        } // Use ref
                    }))

                setNodes(flowNodes)
                setEdges(flowEdges)
                setRawNodes(historyNodes)

                setNodes(flowNodes)
                setEdges(flowEdges)
                setRawNodes(historyNodes)
            }
        } catch { /* ignore */ }
    }

    // Use a ref for deleteEdge function to be used in fetchNodes without dependency cycle
    const deleteEdgeRef = useRef<(edgeId: string) => void>(() => { })
    const insertNodeRef = useRef<(edgeId: string, sourceId: string, targetId: string) => void>(() => { })

    const onConnect = useCallback(async (connection: Connection) => {
        if (!connection.source || !connection.target) {
            return
        }

        const newEdge: HistoryFlowEdge = {
            id: `e-${connection.source}-${connection.target}`,
            source: connection.source,
            target: connection.target,
            type: 'deletable',
            style: { stroke: '#52525b', strokeWidth: 2 },
            data: {
                onDelete: deleteEdgeRef.current,
                onInsert: insertNodeRef.current,
                source: connection.source,
                target: connection.target,
            },
        }

        // Optimistic update
        setEdges((eds) => [...eds, newEdge])

        // Persist to DB
        try {
            const res = await fetch(`/api/cars/${carId}/history/${connection.target}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentId: connection.source,
                }),
            })
            if (!res.ok) {
                console.error('Failed to link nodes')
                // Revert or show error (could implement revert logic here)
            }
        } catch (err) {
            console.error('Failed to link nodes:', err)
        }
    }, [carId, setEdges])

    // Delete an edge
    const deleteEdge = useCallback(async (edgeId: string) => {
        // Find the edge to get the target node ID
        const edgeToDelete = edges.find((edge) => edge.id === edgeId)
        if (!edgeToDelete) return

        // Optimistic update
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))

        // Persist to DB (set parentId to null)
        try {
            const res = await fetch(`/api/cars/${carId}/history/${edgeToDelete.target}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentId: null, // Disconnect
                }),
            })
            if (!res.ok) {
                console.error('Failed to unlink nodes')
            }
        } catch (err) {
            console.error('Failed to unlink nodes:', err)
        }
    }, [edges, carId, setEdges])

    // Insert node between two others
    const handleInsertNode = useCallback((edgeId: string, sourceId: string, targetId: string) => {
        console.log('Inserting node between', sourceId, 'and', targetId)
        setInsertionContext({ parentId: sourceId, childId: targetId })
        setShowAddModal(true)
    }, [])

    // Update ref whenever handlers change
    useEffect(() => {
        deleteEdgeRef.current = deleteEdge
        insertNodeRef.current = handleInsertNode
    }, [deleteEdge, handleInsertNode])

    const savePositions = async () => {
        setSaving(true)
        console.log('Saving positions for', nodes.length, 'nodes')
        try {
            const results = await Promise.all(
                nodes.map(async (node) => {
                    console.log('Saving node:', node.id, 'at', node.position.x, node.position.y)
                    const res = await fetch(`/api/cars/${carId}/history/${node.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            positionX: node.position.x,
                            positionY: node.position.y,
                        }),
                    })
                    if (!res.ok) {
                        const data = await res.json()
                        console.error('Failed to save node', node.id, ':', data.error)
                        return { success: false, nodeId: node.id, error: data.error }
                    }
                    return { success: true, nodeId: node.id }
                })
            )
            const failed = results.filter(r => !r.success)
            if (failed.length > 0) {
                console.error('Some nodes failed to save:', failed)
                alert(`Failed to save ${failed.length} node(s). Check console for details.`)
            } else {
                console.log('All positions saved successfully!')
            }
        } catch (err) {
            console.error('Failed to save positions:', err)
            alert('Failed to save positions. Check console for details.')
        } finally {
            setSaving(false)
            setHasChanges(false)
        }
    }

    // Autosave single node position when dragging stops
    const onNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, node: HistoryFlowNode) => {
        if (!isOwner) return
        setHasChanges(true)

        // Only auto-save if enabled
        if (!autoSaveEnabled) return

        // Debounce to avoid too many API calls
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            console.log('Autosaving node:', node.id, 'at', node.position.x, node.position.y)
            try {
                const res = await fetch(`/api/cars/${carId}/history/${node.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        positionX: node.position.x,
                        positionY: node.position.y,
                    }),
                })
                if (!res.ok) {
                    const data = await res.json()
                    console.error('Autosave failed:', data.error)
                } else {
                    console.log('Autosave successful for node:', node.id)
                    setHasChanges(false)
                }
            } catch (err) {
                console.error('Failed to autosave position:', err)
            }
        }, 500)
    }, [carId, isOwner, autoSaveEnabled])



    // When dragging from a handle and releasing on empty canvas, open add modal
    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
        if (!isOwner) return

        // Check if we dropped on empty canvas (not on a node)
        const targetIsPane = event.target?.classList?.contains('react-flow__pane')
        if (targetIsPane) {
            const bounds = reactFlowWrapper.current?.getBoundingClientRect()
            if (bounds) {
                const point = getEventClientPoint(event)
                setPendingConnection({ x: point.x - bounds.left, y: point.y - bounds.top })
                setShowAddModal(true)
            }
        }
    }, [isOwner])

    const handleContextMenu = useCallback((event: React.MouseEvent, node?: HistoryFlowNode) => {
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
        setPopupData(null)
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
                setNodes((nds) => nds.filter((node) => node.id !== contextMenu.nodeId))
                setEdges((eds) => eds.filter((edge) => edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId))
                // Also update rawNodes for cost calculation
                setRawNodes(prev => prev.filter(n => n.id !== contextMenu.nodeId))
            }
        } catch (err) {
            console.error('Failed to delete node:', err)
        }
        setContextMenu(null)
    }, [contextMenu, carId, setNodes, setEdges])

    const handleEditNode = useCallback(() => {
        if (!contextMenu?.nodeId) return
        const nodeData = rawNodes.find(n => n.id === contextMenu.nodeId)
        if (nodeData) {
            setEditingNode(nodeData)
        }
        setContextMenu(null)
    }, [contextMenu, rawNodes])

    const onNodeClick = useCallback((event: React.MouseEvent, node: HistoryFlowNode) => {
        // If node has a linked post, show the popup near the node
        if (node.data.post) {
            // Calculate position relative to the viewport/container
            // event.clientX/Y are reliable for screen positioning
            setPopupData({
                x: event.clientX,
                y: event.clientY,
                post: node.data.post
            })
        } else {
            setPopupData(null)
        }
    }, [])



    const handleBranchNode = useCallback(() => {
        if (!contextMenu?.nodeId) return
        // Open add modal with the parent node set
        // For now, just open add modal - branching will be implemented later
        setShowAddModal(true)
        setContextMenu(null)
    }, [contextMenu])

    // Calculate costs by category
    const costsByCategory = rawNodes.reduce((acc, node) => {
        if (node.cost) {
            const category = node.type
            acc[category] = (acc[category] || 0) + node.cost
        }
        return acc
    }, {} as Record<string, number>)

    const totalCost = Object.values(costsByCategory).reduce((sum, cost) => sum + cost, 0)

    const categoryLabels: Record<string, string> = {
        purchase: 'Purchase',
        mod_engine: 'Engine Mods',
        mod_suspension: 'Suspension',
        mod_exterior: 'Exterior',
        maintenance: 'Maintenance',
        trip: 'Road Trips',
        custom: 'Other',
    }

    const handleNodeCreated = async (newNode?: CreatedNode | null) => {
        if (!newNode) {
            fetchNodes()
            return
        }

        // If we were inserting between nodes, we need to update the child node
        if (insertionContext) {
            try {
                // Update the child node (insertionContext.childId) to have the new node as parent
                // The new node was already created with parentId = insertionContext.parentId
                const res = await fetch(`/api/cars/${carId}/history/${insertionContext.childId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parentId: newNode.id,
                    }),
                })

                if (!res.ok) {
                    console.error('Failed to link child node to inserted node')
                } else {
                    console.log('Successfully inserted node in chain')
                }
            } catch (err) {
                console.error('Failed to re-link nodes after insertion:', err)
            } finally {
                setInsertionContext(null)
            }
        }

        fetchNodes()
        setShowAddModal(false)
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

                    {/* Cost Summary */}
                    {totalCost > 0 && (
                        <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
                            <button
                                onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-zinc-300">Total Invested</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-green-400">€{totalCost.toLocaleString()}</span>
                                    {showCostBreakdown ? (
                                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                    )}
                                </div>
                            </button>

                            {showCostBreakdown && (
                                <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
                                    {Object.entries(costsByCategory).map(([category, cost]) => (
                                        <div key={category} className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400">{categoryLabels[category] || category}</span>
                                            <span className="text-zinc-300">€{cost.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Event Button */}
                    {isOwner && (
                        <>
                            <Button onClick={() => setShowAddModal(true)} className="w-full">
                                Add Event
                            </Button>

                            {/* Autosave Toggle */}
                            <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700">
                                <span className="text-sm text-zinc-400">Autosave</span>
                                <button
                                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${autoSaveEnabled ? 'bg-green-500' : 'bg-zinc-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoSaveEnabled ? 'left-5' : 'left-0.5'
                                            }`}
                                    />
                                </button>
                            </div>
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
                    onConnectEnd={onConnectEnd}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={handlePaneClick}
                    onNodeClick={onNodeClick}
                    onNodeContextMenu={handleContextMenu}
                    onPaneContextMenu={handleContextMenu}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        type: 'deletable',
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
                    <Controls
                        className="!bg-zinc-800 !border-zinc-700 !rounded-lg !mb-4 !ml-4 [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700"
                    />
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

                    {/* Floating Save Button when changes detected AND autosave is OFF */}
                    {hasChanges && isOwner && !autoSaveEnabled && (
                        <Panel position="top-center">
                            <button
                                onClick={savePositions}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-lg shadow-orange-500/30 transition-all animate-pulse"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </Panel>
                    )}
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
                    onEditNode={handleEditNode}
                    onDeleteNode={handleDeleteNode}
                    onBranchNode={handleBranchNode}
                />
            )}

            {/* Add Node Modal */}
            {showAddModal && (
                <AddNodeModal
                    carId={carId}
                    parentId={insertionContext?.parentId}
                    onClose={() => {
                        setShowAddModal(false)
                        setInsertionContext(null)
                    }}
                    onSuccess={handleNodeCreated}
                />
            )}

            {/* Edit Node Modal */}
            {editingNode && (
                <EditNodeModal
                    node={editingNode}
                    carId={carId}
                    onClose={() => setEditingNode(null)}
                    onSuccess={() => {
                        fetchNodes()
                        setEditingNode(null)
                    }}
                />
            )}

            {/* Floating Post Popup */}
            {popupData && (
                <div
                    className="fixed z-50 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: popupData.x,
                        top: popupData.y,
                        transform: 'translate(-50%, -110%)' // Center horizontally above the click
                    }}
                >
                    {/* Thumbnail */}
                    {popupData.post.thumbnail && (
                        <div className="h-32 w-full bg-zinc-800 relative">
                            <img
                                src={popupData.post.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-80" />
                        </div>
                    )}

                    <div className="p-4 relative">
                        {!popupData.post.thumbnail && (
                            <div className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                                <FileText className="w-4 h-4 text-orange-500" />
                            </div>
                        )}

                        <h4 className="font-bold text-white text-sm mb-1 line-clamp-2 pr-6">
                            {popupData.post.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-orange-400 mb-3">
                            <FileText className="w-3 h-3" />
                            <span>Linked Blog Post</span>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/${locale}/posts/${popupData.post.id}`}
                                className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg text-center transition-colors"
                            >
                                Read Post
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setPopupData(null)
                                }}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* Arrow Pointer */}
                    <div
                        className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 transform rotate-45"
                    />
                </div>
            )}
        </div>
    )
}
