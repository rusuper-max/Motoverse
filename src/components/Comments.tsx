'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Reply, MoreHorizontal, Pencil, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CommentAuthor {
    id: string
    username: string
    name: string | null
    avatar: string | null
}

interface CommentData {
    id: string
    content: string
    createdAt: string
    author: CommentAuthor
    isLiked: boolean
    _count: {
        likes: number
        replies: number
    }
    replies?: CommentData[]
}

interface CommentsProps {
    postId: string
    comments: CommentData[]
    currentUser: { id: string; avatar?: string | null; name?: string | null } | null
    locale: string
    onCommentAdded: (comment: CommentData, parentId?: string) => void
    onCommentUpdated: (comment: CommentData) => void
    onCommentDeleted: (commentId: string, parentId?: string) => void
}

export default function Comments({
    postId,
    comments,
    currentUser,
    locale,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
}: CommentsProps) {
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser || !newComment.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            const data = await res.json()
            if (data.comment) {
                onCommentAdded(data.comment)
                setNewComment('')
            }
        } catch (err) {
            console.error('Failed to post comment', err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Comment Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt={currentUser.name || ''} className="w-full h-full object-cover" />
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
                                <Button type="submit" disabled={submitting || !newComment.trim()}>
                                    {submitting ? 'Posting...' : 'Post Comment'}
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
            {comments.length === 0 ? (
                <p className="text-zinc-500 text-center italic py-4">No comments yet. Be the first!</p>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            currentUser={currentUser}
                            locale={locale}
                            onCommentAdded={onCommentAdded}
                            onCommentUpdated={onCommentUpdated}
                            onCommentDeleted={onCommentDeleted}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface CommentItemProps {
    comment: CommentData
    postId: string
    currentUser: { id: string; avatar?: string | null; name?: string | null } | null
    locale: string
    parentId?: string
    onCommentAdded: (comment: CommentData, parentId?: string) => void
    onCommentUpdated: (comment: CommentData) => void
    onCommentDeleted: (commentId: string, parentId?: string) => void
}

function CommentItem({
    comment,
    postId,
    currentUser,
    locale,
    parentId,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
}: CommentItemProps) {
    const [isLiked, setIsLiked] = useState(comment.isLiked)
    const [likeCount, setLikeCount] = useState(comment._count.likes)
    const [showReplies, setShowReplies] = useState(true)
    const [replyMode, setReplyMode] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [editContent, setEditContent] = useState(comment.content)
    const [submitting, setSubmitting] = useState(false)

    const isOwner = currentUser?.id === comment.author.id

    const handleLike = async () => {
        if (!currentUser) {
            window.location.href = `/${locale}/login`
            return
        }

        // Optimistic update
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

        try {
            await fetch(`/api/comments/${comment.id}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
            })
        } catch {
            // Revert on error
            setIsLiked(isLiked)
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
        }
    }

    const handleReply = async () => {
        if (!currentUser || !replyContent.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyContent,
                    parentId: comment.id,
                }),
            })

            const data = await res.json()
            if (data.comment) {
                onCommentAdded(data.comment, comment.id)
                setReplyContent('')
                setReplyMode(false)
            }
        } catch (err) {
            console.error('Failed to reply', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!editContent.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/comments/${comment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent }),
            })

            const data = await res.json()
            if (data.comment) {
                onCommentUpdated({ ...comment, content: editContent })
                setEditMode(false)
            }
        } catch (err) {
            console.error('Failed to edit', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        try {
            await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
            onCommentDeleted(comment.id, parentId)
        } catch (err) {
            console.error('Failed to delete', err)
        }
    }

    return (
        <div className="flex gap-4">
            {/* Avatar with link to profile */}
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
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/${locale}/u/${comment.author.username}`}
                                className="text-white font-medium hover:text-orange-400 transition-colors"
                            >
                                {comment.author.name || comment.author.username}
                            </Link>
                            <Link
                                href={`/${locale}/u/${comment.author.username}`}
                                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                            >
                                @{comment.author.username}
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            {isOwner && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                            <button
                                                onClick={() => { setEditMode(true); setShowMenu(false) }}
                                                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => { handleDelete(); setShowMenu(false) }}
                                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content or Edit Form */}
                    {editMode ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none text-sm"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => { setEditMode(false); setEditContent(comment.content) }}
                                    className="px-3 py-1 text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEdit}
                                    disabled={submitting || !editContent.trim()}
                                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    )}
                </div>

                {/* Actions */}
                {!editMode && (
                    <div className="flex items-center gap-4 mt-2 ml-2">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                                isLiked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            {likeCount > 0 && <span>{likeCount}</span>}
                        </button>

                        {currentUser && !parentId && (
                            <button
                                onClick={() => setReplyMode(!replyMode)}
                                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
                            >
                                <Reply className="w-4 h-4" />
                                Reply
                            </button>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors"
                            >
                                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>
                )}

                {/* Reply Form */}
                {replyMode && currentUser && (
                    <div className="mt-3 ml-2 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-zinc-500 m-auto mt-2" />
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Reply to @${comment.author.username}...`}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none text-sm"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end mt-2">
                                <button
                                    onClick={() => { setReplyMode(false); setReplyContent('') }}
                                    className="px-3 py-1 text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReply}
                                    disabled={submitting || !replyContent.trim()}
                                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Posting...' : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Replies */}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-2 border-l-2 border-zinc-800">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                currentUser={currentUser}
                                locale={locale}
                                parentId={comment.id}
                                onCommentAdded={onCommentAdded}
                                onCommentUpdated={onCommentUpdated}
                                onCommentDeleted={onCommentDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
