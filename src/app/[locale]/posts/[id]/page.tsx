'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Heart, Share2, Calendar, User, Car } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Locale } from '@/i18n/config'
import RichTextRenderer from '@/components/blog/RichTextRenderer'
import Button from '@/components/ui/Button'

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

interface Comment {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
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
    const [comments, setComments] = useState<Comment[]>([])
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [newComment, setNewComment] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

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

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            router.push(`/${locale}/login`)
            return
        }
        if (!newComment.trim()) return

        setSubmittingComment(true)
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            const data = await res.json()
            if (data.comment) {
                setComments(prev => [...prev, data.comment])
                setNewComment('')
            }
        } catch (err) {
            console.error('Failed to post comment', err)
        } finally {
            setSubmittingComment(false)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
    }

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

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {post.author.avatar ? (
                                        <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-medium">{post.author.name || post.author.username}</div>
                                    <div className="text-xs text-zinc-500">@{post.author.username}</div>
                                </div>
                            </div>

                            {post.car && post.car.generation && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                    <Car className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm text-zinc-300">
                                        {post.car.year} {post.car.generation.model.make.name} {post.car.generation.model.name}
                                    </span>
                                </div>
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
                        Comments ({comments.length})
                    </h2>

                    {/* Comment Form */}
                    {user ? (
                        <form onSubmit={handleCommentSubmit} className="mb-8">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-zinc-500 m-auto mt-2.5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none mb-3"
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                                            {submittingComment ? 'Posting...' : 'Post Comment'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6 text-center mb-8">
                            <p className="text-zinc-400 mb-4">Log in to join the discussion</p>
                            <Link href={`/${locale}/login`}>
                                <Button variant="secondary">Log In</Button>
                            </Link>
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-zinc-500 text-center italic py-4">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                                        {comment.author.avatar ? (
                                            <img src={comment.author.avatar} alt={comment.author.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-zinc-500 m-auto mt-2.5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-medium">{comment.author.name || comment.author.username}</span>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
