'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, Wrench, Settings, Paintbrush, MapPin, FileText, Calendar, MapPinned, DollarSign, Link as LinkIcon } from 'lucide-react'

interface HistoryCardProps {
    node: {
        id: string
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
        } | null
        author: {
            username: string
            name: string | null
        }
    }
    locale: string
    isFirst?: boolean
    isLast?: boolean
}

const NODE_TYPES = {
    purchase: { icon: Key, label: 'Purchase', color: 'from-green-500 to-emerald-600' },
    mod_engine: { icon: Settings, label: 'Engine Mod', color: 'from-orange-500 to-red-600' },
    mod_suspension: { icon: Wrench, label: 'Suspension', color: 'from-blue-500 to-indigo-600' },
    mod_exterior: { icon: Paintbrush, label: 'Exterior', color: 'from-purple-500 to-pink-600' },
    maintenance: { icon: Wrench, label: 'Maintenance', color: 'from-yellow-500 to-amber-600' },
    trip: { icon: MapPin, label: 'Road Trip', color: 'from-cyan-500 to-teal-600' },
    custom: { icon: FileText, label: 'Event', color: 'from-zinc-500 to-zinc-600' },
}

export default function HistoryCard({ node, locale, isFirst, isLast }: HistoryCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)

    const nodeType = NODE_TYPES[node.type as keyof typeof NODE_TYPES] || NODE_TYPES.custom
    const Icon = nodeType.icon

    const formattedDate = new Date(node.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <div className="relative flex items-start gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
                {/* Top line */}
                {!isFirst && (
                    <div className="w-0.5 h-4 bg-gradient-to-b from-zinc-700 to-zinc-600" />
                )}
                {/* Node dot */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${nodeType.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {/* Bottom line */}
                {!isLast && (
                    <div className="w-0.5 flex-1 min-h-8 bg-gradient-to-b from-zinc-600 to-zinc-700" />
                )}
            </div>

            {/* Card with flip effect */}
            <div
                className="flex-1 perspective-1000 mb-4"
                onMouseEnter={() => setIsFlipped(true)}
                onMouseLeave={() => setIsFlipped(false)}
            >
                <div
                    className={`relative w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front of card */}
                    <div
                        className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${node.isLocked ? 'opacity-70' : 'hover:border-zinc-700'
                            } transition-all backface-hidden`}
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded bg-gradient-to-r ${nodeType.color} text-white`}>
                                {nodeType.label}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Calendar className="w-3 h-3" />
                                {formattedDate}
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{node.title}</h3>
                        {node.isLocked && (
                            <span className="text-xs text-zinc-500 mt-1 inline-block">🔒 Locked</span>
                        )}
                    </div>

                    {/* Back of card */}
                    <div
                        className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded-xl p-4 backface-hidden rotate-y-180"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <p className="text-zinc-300 text-sm mb-3 line-clamp-3">
                            {node.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                            {node.mileage && (
                                <div className="flex items-center gap-1">
                                    <MapPinned className="w-3 h-3" />
                                    {node.mileage.toLocaleString()} km
                                </div>
                            )}
                            {node.cost && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    €{node.cost.toLocaleString()}
                                </div>
                            )}
                            {node.post && (
                                <Link
                                    href={`/${locale}/posts/${node.post.id}`}
                                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <LinkIcon className="w-3 h-3" />
                                    View Post
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
