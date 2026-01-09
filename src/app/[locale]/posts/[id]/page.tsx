'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Heart, Share2, Calendar, User, Car, Edit3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Locale } from '@/i18n/config'
import RichTextRenderer from '@/components/blog/RichTextRenderer'
import Comments from '@/components/Comments'

interface Post {
    id: string
    title: string
    content: string
    images: string | null
    category: string
    mileage: number | null
    cost: number | null
    createdAt: string
    author: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    car: {
        id: string
        year: number
        generation: {
            model: {
                name: string
                make: { name: string }
            }
        } | null
    } | null
    _count: {
        comments: number
        likes: number
    }
}

interface CommentData {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    isLiked: boolean
    _count: {
        likes: number
        replies: number
    }
    replies?: CommentData[]
}

export default function PostDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = params.locale as Locale
    const postId = params.id as string
    const { user } = useAuth()

    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState<CommentData[]>([])
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)

    // Fetch Post
    useEffect(() => {
        fetch(`/api/posts/${postId}`)
            .then(res => res.json())
            .then(data => {
                if (data.post) {
                    setPost(data.post)
                    setLikeCount(data.post._count.likes)
                    setIsLiked(data.isLiked)
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [postId])

    // Fetch Comments
    useEffect(() => {
        if (postId) {
            fetch(`/api/posts/${postId}/comments`)
                .then(res => res.json())
                .then(data => setComments(data.comments || []))
        }
    }, [postId])

    const handleLike = async () => {
        if (!user) {
            router.push(`/${locale}/login`)
            return
        }

        // Optimistic update
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

        try {
            await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
        } catch {
            // Revert if failed
            setIsLiked(isLiked)
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
    }

    // Comment handlers
    const handleCommentAdded = (newComment: CommentData, parentId?: string) => {
        if (parentId) {
            // Add reply to parent comment
            setComments(prev => prev.map(c => {
                if (c.id === parentId) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), newComment],
                        _count: { ...c._count, replies: c._count.replies + 1 }
                    }
                }
                return c
            }))
        } else {
            // Add top-level comment
            setComments(prev => [...prev, newComment])
        }
    }

    const handleCommentUpdated = (updatedComment: CommentData) => {
        setComments(prev => prev.map(c => {
            if (c.id === updatedComment.id) {
                return { ...c, content: updatedComment.content }
            }
            // Check in replies
            if (c.replies) {
                return {
                    ...c,
                    replies: c.replies.map(r =>
                        r.id === updatedComment.id ? { ...r, content: updatedComment.content } : r
                    )
                }
            }
            return c
        }))
    }

    const handleCommentDeleted = (commentId: string, parentId?: string) => {
        if (parentId) {
            // Remove reply
            setComments(prev => prev.map(c => {
                if (c.id === parentId) {
                    return {
                        ...c,
                        replies: (c.replies || []).filter(r => r.id !== commentId),
                        _count: { ...c._count, replies: Math.max(0, c._count.replies - 1) }
                    }
                }
                return c
            }))
        } else {
            // Remove top-level comment
            setComments(prev => prev.filter(c => c.id !== commentId))
        }
    }

    // Count total comments including replies
    const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

    if (loading) {
        return (
            <div className="min-h-screen pt-20 pb-12 bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen pt-20 pb-12 bg-zinc-950 flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Post not found</h1>
                <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300">
                    Go Home
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-12 bg-zinc-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Back Link */}
                <div className="mb-8">
                    {searchParams.get('from') === 'history' && post.car ? (
                        <Link
                            href={`/${locale}/garage/${post.car.id}/history`}
                            className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to History
                        </Link>
                    ) : post.car && post.car.generation ? (
                        <Link
                            href={`/${locale}/garage/${post.car.id}`}
                            className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to {post.car.generation.model.make.name} {post.car.generation.model.name}
                        </Link>
                    ) : (
                        <Link
                            href={`/${locale}`}
                            className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    )}
                </div>

                {/* Post Container */}
                <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
                    {/* Header */}
                    <div className="p-8 border-b border-zinc-800">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium uppercase tracking-wider">
                                {post.category}
                            </span>
                            <span className="text-zinc-500 text-sm flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-4 mb-6">
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                {post.title}
                            </h1>
                            {user?.id === post.author.id && (
                                <Link
                                    href={`/${locale}/posts/${post.id}/edit`}
                                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors text-sm shrink-0"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <Link href={`/${locale}/u/${post.author.username}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-orange-500 transition-all">
                                    {post.author.avatar ? (
                                        <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-medium group-hover:text-orange-400 transition-colors">{post.author.name || post.author.username}</div>
                                    <div className="text-xs text-zinc-500">@{post.author.username}</div>
                                </div>
                            </Link>

                            {post.car && post.car.generation && (
                                <Link
                                    href={`/${locale}/garage/${post.car.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-orange-500 transition-colors"
                                >
                                    <Car className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm text-zinc-300">
                                        {post.car.year} {post.car.generation.model.make.name} {post.car.generation.model.name}
                                    </span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <RichTextRenderer content={post.content} />
                    </div>

                    {/* Actions */}
                    <div className="px-8 py-6 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{likeCount}</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="font-medium">Share</span>
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-orange-500" />
                        Comments ({totalComments})
                    </h2>

                    <Comments
                        postId={postId}
                        comments={comments}
                        currentUser={user ? { id: user.id, avatar: user.avatar, name: user.name } : null}
                        locale={locale}
                        onCommentAdded={handleCommentAdded}
                        onCommentUpdated={handleCommentUpdated}
                        onCommentDeleted={handleCommentDeleted}
                    />
                </section>
            </div>
        </div>
    )
}
