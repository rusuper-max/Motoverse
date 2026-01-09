'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Wrench, Gauge, Car, MapPin, FileText, ChevronLeft, Save, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import RichTextEditor from '@/components/blog/RichTextEditor'
import { useAuth } from '@/hooks/useAuth'
import { Locale } from '@/i18n/config'

const POST_CATEGORIES = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Oil change, repairs, servicing' },
    { id: 'modification', label: 'Modification', icon: Gauge, description: 'Upgrades, tuning, parts' },
    { id: 'journey', label: 'Road Trip', icon: MapPin, description: 'Adventures, drives, events' },
    { id: 'review', label: 'Review', icon: FileText, description: 'Thoughts, impressions, tips' },
    { id: 'other', label: 'Other', icon: Car, description: 'Everything else' },
]

interface Post {
    id: string
    title: string
    content: string
    category: string
    mileage: number | null
    cost: number | null
    thumbnail: string | null
    author: {
        id: string
        username: string
    }
    car: {
        id: string
        year: number
        generation?: {
            model: {
                name: string
                make: { name: string }
            }
        }
    }
}

export default function EditPostPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as Locale
    const postId = params.id as string
    const { user, loading: authLoading } = useAuth()

    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('maintenance')
    const [mileage, setMileage] = useState('')
    const [cost, setCost] = useState('')

    useEffect(() => {
        fetchPost()
    }, [postId])

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/posts/${postId}`)
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to load post')
                return
            }

            setPost(data.post)
            setTitle(data.post.title)
            setContent(data.post.content)
            setCategory(data.post.category || 'maintenance')
            setMileage(data.post.mileage?.toString() || '')
            setCost(data.post.cost?.toString() || '')
        } catch (err) {
            setError('Failed to load post')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    mileage: mileage ? parseInt(mileage) : null,
                    cost: cost ? parseFloat(cost) : null,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update post')
            }

            router.push(`/${locale}/posts/${postId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        setError('')

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete post')
            }

            // Redirect to car page
            if (post?.car) {
                router.push(`/${locale}/garage/${post.car.id}`)
            } else {
                router.push(`/${locale}`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setDeleting(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    if (error && !post) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Post not found</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        )
    }

    if (post && user?.id !== post.author.id) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Not authorized</h2>
                    <p className="text-zinc-400 mb-6">You can only edit your own posts.</p>
                    <Link
                        href={`/${locale}/posts/${postId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        View Post
                    </Link>
                </div>
            </div>
        )
    }

    const getCarName = () => {
        if (post?.car?.generation) {
            return `${post.car.year} ${post.car.generation.model.make.name} ${post.car.generation.model.name}`
        }
        return 'Car'
    }

    return (
        <div className="min-h-screen pt-20 pb-12 bg-zinc-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/${locale}/posts/${postId}`}
                        className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to post
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Edit Post</h1>
                    <p className="text-zinc-400 mt-1">{getCarName()}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {POST_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`p-4 rounded-xl border text-left transition-all ${category === cat.id
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'
                                        }`}
                                >
                                    <cat.icon className={`w-5 h-5 mb-2 ${category === cat.id ? 'text-orange-500' : 'text-zinc-400'
                                        }`} />
                                    <div className={`font-medium ${category === cat.id ? 'text-white' : 'text-zinc-300'
                                        }`}>
                                        {cat.label}
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-0.5">{cat.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                            placeholder="e.g., First oil change at 50,000 km"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-zinc-300 mb-2">
                            Content *
                        </label>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write about what you did, parts used, tips for others..."
                        />
                    </div>

                    {/* Mileage & Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="mileage" className="block text-sm font-medium text-zinc-300 mb-2">
                                Mileage (km)
                            </label>
                            <input
                                type="number"
                                id="mileage"
                                value={mileage}
                                onChange={(e) => setMileage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                                placeholder="e.g., 50000"
                            />
                        </div>
                        <div>
                            <label htmlFor="cost" className="block text-sm font-medium text-zinc-300 mb-2">
                                Cost (€)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="cost"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                                placeholder="e.g., 150"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex gap-4 flex-1">
                            <Button type="submit" disabled={saving} className="flex-1">
                                <Save className="w-5 h-5 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Link href={`/${locale}/posts/${postId}`}>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                        >
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete
                        </Button>
                    </div>
                </form>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
                            <p className="text-zinc-400 mb-6">
                                Are you sure you want to delete this post? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1"
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Post'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
