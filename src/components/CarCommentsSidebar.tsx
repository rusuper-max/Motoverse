'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, User, Loader2, Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface CarComment {
    id: string
    content: string
    createdAt: string
    isLiked: boolean
    author: {
        id: string
        username: string
        name: string | null
        avatar: string | null
    }
    _count: {
        likes: number
        replies: number
    }
    replies: CarComment[]
}

interface CarCommentsSidebarProps {
    carId: string
    locale: string
    currentUser: { id: string; avatar?: string | null; name?: string | null } | null
}

export default function CarCommentsSidebar({ carId, locale, currentUser }: CarCommentsSidebarProps) {
    const [comments, setComments] = useState<CarComment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchComments()
    }, [carId])

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/cars/${carId}/comments`)
            const data = await res.json()
            setComments(data.comments || [])
        } catch (error) {
            console.error('Failed to fetch car comments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser || !newComment.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/cars/${carId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            const data = await res.json()
            if (data.comment) {
                setComments(prev => [data.comment, ...prev])
                setNewComment('')
            }
        } catch (error) {
            console.error('Failed to post comment:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleReply = async (parentId: string) => {
        if (!currentUser || !replyContent.trim()) return

        try {
            const res = await fetch(`/api/cars/${carId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent, parentId }),
            })

            const data = await res.json()
            if (data.comment) {
                setComments(prev => prev.map(c => {
                    if (c.id === parentId) {
                        return {
                            ...c,
                            replies: [...c.replies, data.comment],
                            _count: { ...c._count, replies: c._count.replies + 1 }
                        }
                    }
                    return c
                }))
                setReplyContent('')
                setReplyingTo(null)
                setExpandedReplies(prev => new Set([...prev, parentId]))
            }
        } catch (error) {
            console.error('Failed to post reply:', error)
        }
    }

    const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!currentUser) return

        try {
            const res = await fetch(`/api/cars/${carId}/comments/${commentId}/like`, {
                method: 'POST',
            })

            const data = await res.json()

            if (isReply && parentId) {
                setComments(prev => prev.map(c => {
                    if (c.id === parentId) {
                        return {
                            ...c,
                            replies: c.replies.map(r => {
                                if (r.id === commentId) {
                                    return {
                                        ...r,
                                        isLiked: data.liked,
                                        _count: { ...r._count, likes: data.likeCount }
                                    }
                                }
                                return r
                            })
                        }
                    }
                    return c
                }))
            } else {
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            isLiked: data.liked,
                            _count: { ...c._count, likes: data.likeCount }
                        }
                    }
                    return c
                }))
            }
        } catch (error) {
            console.error('Failed to like comment:', error)
        }
    }

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev)
            if (next.has(commentId)) {
                next.delete(commentId)
            } else {
                next.add(commentId)
            }
            return next
        })
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const CommentItem = ({ comment, isReply = false, parentId }: { comment: CarComment; isReply?: boolean; parentId?: string }) => (
        <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
            <div className="flex gap-3">
                <Link href={`/${locale}/u/${comment.author.username}`} className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all">
                        {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                                <span className="text-sm font-bold text-white">
                                    {comment.author.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="bg-zinc-800/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href={`/${locale}/u/${comment.author.username}`}
                                className="text-sm font-semibold text-white hover:text-orange-400 transition-colors"
                            >
                                {comment.author.name || comment.author.username}
                            </Link>
                            <span className="text-xs text-zinc-500">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-300 break-words">{comment.content}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2 ml-2">
                        <button
                            onClick={() => handleLike(comment.id, isReply, parentId)}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${comment.isLiked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            {comment._count.likes > 0 && <span>{comment._count.likes}</span>}
                        </button>
                        {!isReply && currentUser && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Reply</span>
                            </button>
                        )}
                        {!isReply && comment._count.replies > 0 && (
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                {expandedReplies.has(comment.id) ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        <span>Hide replies</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        <span>{comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Reply input */}
                    {replyingTo === comment.id && currentUser && (
                        <div className="mt-3 flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-zinc-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleReply(comment.id)
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleReply(comment.id)}
                                    disabled={!replyContent.trim()}
                                    className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {!isReply && expandedReplies.has(comment.id) && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                                <CommentItem key={reply.id} comment={reply} isReply parentId={comment.id} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-white text-lg">Comments</h3>
                <span className="text-sm text-zinc-500">({comments.length})</span>
            </div>

            {/* Comment Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="p-4 border-b border-zinc-800">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-zinc-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span className="hidden sm:inline">Post</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-4 border-b border-zinc-800 text-center">
                    <Link href={`/${locale}/login`} className="text-sm text-orange-400 hover:text-orange-300">
                        Log in to comment
                    </Link>
                </div>
            )}

            {/* Comments List */}
            <div className="p-4">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-sm">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
