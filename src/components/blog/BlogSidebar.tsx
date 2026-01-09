'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, Heart, Calendar, FileText, Edit3 } from 'lucide-react'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface BlogPost {
    id: string
    title: string
    content: string
    images: string | null
    thumbnail: string | null
    category: string
    createdAt: string
    author: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    _count: {
        comments: number
        likes: number
    }
}

interface BlogSidebarProps {
    carId: string
    locale: Locale
    isOwner?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
    maintenance: 'bg-yellow-500/20 text-yellow-400',
    modification: 'bg-orange-500/20 text-orange-400',
    journey: 'bg-cyan-500/20 text-cyan-400',
    review: 'bg-purple-500/20 text-purple-400',
    other: 'bg-zinc-500/20 text-zinc-400',
}

export default function BlogSidebar({ carId, locale, isOwner }: BlogSidebarProps) {
    const { user } = useAuth()
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/cars/${carId}/posts`)
            .then(res => res.json())
            .then(data => {
                setPosts(data.posts || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [carId])

    const getThumbnail = (post: BlogPost): string | null => {
        // Priority: custom thumbnail > first image > null
        if (post.thumbnail) return post.thumbnail
        if (post.images) {
            try {
                const images = JSON.parse(post.images)
                if (Array.isArray(images) && images.length > 0) return images[0]
            } catch { }
        }
        return null
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    if (loading) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-zinc-800 rounded w-1/2" />
                    <div className="h-32 bg-zinc-800 rounded" />
                    <div className="h-32 bg-zinc-800 rounded" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    Blog Posts
                </h3>
                {isOwner && (
                    <Link
                        href={`/${locale}/garage/${carId}/post`}
                        className="text-sm text-orange-400 hover:text-orange-300"
                    >
                        + Write Post
                    </Link>
                )}
            </div>

            {/* Posts List */}
            <div className="max-h-[600px] overflow-y-auto">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No blog posts yet</p>
                        {isOwner && (
                            <Link
                                href={`/${locale}/garage/${carId}/post`}
                                className="inline-block mt-3 text-orange-400 hover:text-orange-300"
                            >
                                Write your first post
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {posts.map((post) => {
                            const thumbnail = getThumbnail(post)
                            const canEdit = user?.id === post.author.id
                            return (
                                <div key={post.id} className="relative group">
                                    <Link
                                        href={`/${locale}/posts/${post.id}`}
                                        className="block hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <div className="p-4">
                                            {/* Thumbnail */}
                                            {thumbnail ? (
                                                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-zinc-800">
                                                    <img
                                                        src={thumbnail}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                                    <FileText className="w-10 h-10 text-zinc-600" />
                                                </div>
                                            )}

                                            {/* Category Badge */}
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.other}`}>
                                                {post.category}
                                            </span>

                                            {/* Title */}
                                            <h4 className="text-white font-medium line-clamp-2 mb-2">
                                                {post.title}
                                            </h4>

                                            {/* Meta */}
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(post.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3" />
                                                    {post._count.likes}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" />
                                                    {post._count.comments}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    {/* Edit button overlay */}
                                    {canEdit && (
                                        <Link
                                            href={`/${locale}/posts/${post.id}/edit`}
                                            className="absolute top-2 right-2 p-2 bg-zinc-900/90 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Edit post"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
