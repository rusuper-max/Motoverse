'use client'

import { useState } from 'react'
import { X, Loader2, Upload, Globe, Instagram, Youtube, Twitter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditProfileModalProps {
    user: {
        username: string
        name: string | null
        bio: string | null
        location: string | null
        country: string | null
        accountType: string | null
        website: string | null
        socialLinks: any
        avatar: string | null
        coverImage: string | null
    }
    onClose: () => void
    onUpdate: () => void
}

const ACCOUNT_TYPES = [
    { value: 'enthusiast', label: 'Enthusiast' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'tuner', label: 'Tuner' },
    { value: 'dealer', label: 'Dealer' },
    { value: 'racer', label: 'Racer' },
    { value: 'collector', label: 'Collector' },
]

export default function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        country: user.country || '',
        accountType: user.accountType || '',
        website: user.website || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || '',
        socialLinks: {
            instagram: user.socialLinks?.instagram || '',
            youtube: user.socialLinks?.youtube || '',
            tiktok: user.socialLinks?.tiktok || '',
            x: user.socialLinks?.x || '',
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch(`/api/users/${user.username}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!res.ok) throw new Error('Failed to update profile')

            onUpdate()
            onClose()
            router.refresh()
        } catch (error) {
            console.error(error)
            // Add error handling/toast here
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Images Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={formData.avatar}
                                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                    placeholder="https://..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image URL</label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={formData.coverImage}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                    placeholder="https://..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Account Type</label>
                                <select
                                    value={formData.accountType}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                                >
                                    <option value="">Select type...</option>
                                    {ACCOUNT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Location (City)</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-300">Social Links</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Instagram</label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={formData.socialLinks.instagram}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                        placeholder="@username"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">YouTube</label>
                                <div className="relative">
                                    <Youtube className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={formData.socialLinks.youtube}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                                        placeholder="Channel URL"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">X (Twitter)</label>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={formData.socialLinks.x}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, x: e.target.value } })}
                                        placeholder="@username"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
