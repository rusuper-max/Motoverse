'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save, Wrench, Gauge, Car, MapPin, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'

const POST_CATEGORIES = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Oil change, repairs, servicing' },
    { id: 'modification', label: 'Modification', icon: Gauge, description: 'Upgrades, tuning, parts' },
    { id: 'journey', label: 'Road Trip', icon: MapPin, description: 'Adventures, drives, events' },
    { id: 'review', label: 'Review', icon: FileText, description: 'Thoughts, impressions, tips' },
    { id: 'other', label: 'Other', icon: Car, description: 'Everything else' },
]

export default function CreatePostPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as Locale
    const carId = params.id as string
    const dict = getDictionary(locale)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('maintenance')
    const [mileage, setMileage] = useState('')
    const [cost, setCost] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/cars/${carId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    mileage: mileage || null,
                    cost: cost || null,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create post')
            }

            router.push(`/${locale}/garage/${carId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pt-20 pb-12 bg-zinc-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/${locale}/garage/${carId}`}
                        className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to car
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Write a Post</h1>
                    <p className="text-zinc-400 mt-1">Document your car&apos;s history</p>
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
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                            placeholder="Write about what you did, parts used, tips for others..."
                            required
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

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1">
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? 'Saving...' : 'Publish Post'}
                        </Button>
                        <Link href={`/${locale}/garage/${carId}`}>
                            <Button variant="secondary" type="button">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
