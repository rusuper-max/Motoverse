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
    type OnNodeDrag,
    type OnConnectStart,
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

interface HistoryFlowNodeData extends Record<string, unknown> {
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

interface HistoryEdgeData extends Record<string, unknown> {
    onDelete: (edgeId: string) => void
    onInsert: (edgeId: string, sourceId: string, targetId: string) => void
    source: string
    target: string
}

interface PopupData {
    x: number
    y: number
    nodeData: HistoryFlowNodeData
    post: { id: string; title: string; thumbnail: string | null } | null
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
    const [pendingConnection, setPendingConnection] = useState<{ x: number; y: number; sourceNodeId?: string } | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)
    const [editingNode, setEditingNode] = useState<HistoryNodeData | null>(null)
    const [insertionContext, setInsertionContext] = useState<{ parentId: string; childId: string } | null>(null)
    const [popupData, setPopupData] = useState<PopupData | null>(null)

    const [nodes, setNodes, onNodesChange] = useNodesState<HistoryFlowNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<HistoryFlowEdge>([])

    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const connectingNodeId = useRef<string | null>(null)

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
        // Use setEdges callback to get current edges and find the one to delete
        let targetNodeId: string | null = null

        setEdges((currentEdges) => {
            const edgeToDelete = currentEdges.find((edge) => edge.id === edgeId)
            if (edgeToDelete) {
                targetNodeId = edgeToDelete.target
            }
            // Optimistic update - filter out the edge
            return currentEdges.filter((edge) => edge.id !== edgeId)
        })

        // Wait a tick for targetNodeId to be set, then persist to DB
        setTimeout(async () => {
            if (!targetNodeId) {
                console.error('Could not find edge to delete:', edgeId)
                return
            }

            try {
                const res = await fetch(`/api/cars/${carId}/history/${targetNodeId}`, {
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
        }, 0)
    }, [carId, setEdges])

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
    const onNodeDragStop: OnNodeDrag<HistoryFlowNode> = useCallback((_event, node) => {
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



    // Track which node we're connecting from
    const onConnectStart: OnConnectStart = useCallback((_event, { nodeId }) => {
        connectingNodeId.current = nodeId
    }, [])

    // When dragging from a handle and releasing on empty canvas, open add modal
    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
        if (!isOwner) return

        // Check if we dropped on empty canvas (not on a node)
        const target = event.target
        const targetIsPane =
            target instanceof HTMLElement && target.classList.contains('react-flow__pane')
        if (targetIsPane && connectingNodeId.current) {
            const bounds = reactFlowWrapper.current?.getBoundingClientRect()
            if (bounds) {
                const point = getEventClientPoint(event)
                setPendingConnection({
                    x: point.x - bounds.left,
                    y: point.y - bounds.top,
                    sourceNodeId: connectingNodeId.current
                })
                setShowAddModal(true)
            }
        }
        connectingNodeId.current = null
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

    const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
        event.preventDefault()
        if (!isOwner) return

        setContextMenu({
            x: event.clientX,
            y: event.clientY,
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
        // Always show node detail popup on click
        setPopupData({
            x: event.clientX,
            y: event.clientY,
            nodeData: node.data,
            post: node.data.post || null
        })
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
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={handlePaneClick}
                    onNodeClick={onNodeClick}
                    onNodeContextMenu={handleContextMenu}
                    onPaneContextMenu={handlePaneContextMenu}
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
                    parentId={insertionContext?.parentId || pendingConnection?.sourceNodeId}
                    onClose={() => {
                        setShowAddModal(false)
                        setInsertionContext(null)
                        setPendingConnection(null)
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

            {/* Floating Node Detail Popup */}
            {popupData && (
                <div
                    className="fixed z-50 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: Math.min(popupData.x, window.innerWidth - 340),
                        top: Math.max(20, popupData.y - 20),
                        transform: 'translateY(-100%)'
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-800">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">{popupData.nodeData.type}</span>
                                <h3 className="text-white font-bold mt-1 line-clamp-2">{popupData.nodeData.title}</h3>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setPopupData(null)
                                }}
                                className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-400">
                            {popupData.nodeData.date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(popupData.nodeData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            {popupData.nodeData.mileage && (
                                <span className="flex items-center gap-1">
                                    <Car className="w-3 h-3" />
                                    {popupData.nodeData.mileage.toLocaleString()} km
                                </span>
                            )}
                            {popupData.nodeData.cost && popupData.nodeData.cost > 0 && (
                                <span className="flex items-center gap-1 text-green-400 font-medium">
                                    <DollarSign className="w-3 h-3" />
                                    €{popupData.nodeData.cost.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-4 max-h-40 overflow-y-auto">
                        {popupData.nodeData.description ? (
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{popupData.nodeData.description}</p>
                        ) : (
                            <p className="text-sm text-zinc-600 italic">No description provided</p>
                        )}
                    </div>

                    {/* Linked Blog Post */}
                    {popupData.post && (
                        <div className="p-4 pt-0">
                            <Link
                                href={`/${locale}/posts/${popupData.post.id}`}
                                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-orange-500/50 transition-colors"
                            >
                                {popupData.post.thumbnail && (
                                    <img src={popupData.post.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-orange-400 font-medium">Linked Blog Post</p>
                                    <p className="text-white text-sm font-medium truncate">{popupData.post.title}</p>
                                </div>
                                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                            </Link>
                        </div>
                    )}

                    {/* Arrow Pointer */}
                    <div
                        className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 transform rotate-45"
                    />
                </div>
            )}
        </div>
    )
}
