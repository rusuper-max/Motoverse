'use client'

import React from 'react'
import Link from 'next/link'
import { Car, User, FileText, ChevronRight, Loader2, Tag } from 'lucide-react'

interface SearchResult {
    brands: { id: string, name: string, logo: string | null }[]
    models: { id: string, name: string, make: { name: string } }[]
    users: { id: string, username: string, name: string | null, avatar: string | null }[]
    cars: { id: string, nickname: string | null, generation: { model: { name: string, make: { name: string } } } }[]
    posts: { id: string, title: string | null }[]
}

interface SearchOverlayProps {
    results: SearchResult | null
    loading: boolean
    visible: boolean
    onClose: () => void
    locale: string
}

export default function SearchOverlay({ results, loading, visible, onClose, locale }: SearchOverlayProps) {
    if (!visible) return null

    if (loading) {
        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex justify-center z-50">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            </div>
        )
    }

    if (!results) return null

    const hasResults =
        results.brands.length > 0 ||
        results.models.length > 0 ||
        results.users.length > 0 ||
        results.cars.length > 0 ||
        results.posts.length > 0

    if (!hasResults) {
        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 text-center text-zinc-500 z-50">
                No results found
            </div>
        )
    }

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto z-50">
            {/* Brands */}
            {results.brands.length > 0 && (
                <div className="p-2">
                    <h3 className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Brands</h3>
                    {results.brands.map(brand => (
                        <Link
                            key={brand.id}
                            href={`/${locale}/explore?q=${encodeURIComponent(brand.name)}&type=cars`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
                                {brand.logo ? (
                                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Car className="w-4 h-4 text-black" />
                                )}
                            </div>
                            <span className="text-white font-medium">{brand.name}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Models */}
            {results.models.length > 0 && (
                <div className="p-2 border-t border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Models</h3>
                    {results.models.map(model => (
                        <Link
                            key={model.id}
                            href={`/${locale}/explore?q=${encodeURIComponent(model.name)}&type=cars`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <Tag className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <span className="text-white font-medium">{model.name}</span>
                                <span className="text-xs text-zinc-500 ml-2">{model.make.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
                <div className="p-2 border-t border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Users</h3>
                    {results.users.map(user => (
                        <Link
                            key={user.id}
                            href={`/${locale}/u/${user.username}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-700">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                )}
                            </div>
                            <span className="text-white font-medium">{user.name || user.username}</span>
                            <span className="text-xs text-zinc-500">@{user.username}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Cars */}
            {results.cars.length > 0 && (
                <div className="p-2 border-t border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Cars</h3>
                    {results.cars.map(car => (
                        <Link
                            key={car.id}
                            href={`/${locale}/garage/${car.id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Car className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <span className="text-white font-medium">{car.nickname || car.generation.model.name}</span>
                                <span className="text-xs text-zinc-500 block">
                                    {car.generation.model.make.name} {car.generation.model.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Posts */}
            {results.posts.length > 0 && (
                <div className="p-2 border-t border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">Posts</h3>
                    {results.posts.map(post => (
                        <Link
                            key={post.id}
                            href={`/${locale}/posts/${post.id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-zinc-400" />
                            </div>
                            <span className="text-white font-medium line-clamp-1">{post.title || 'Untitled Post'}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
