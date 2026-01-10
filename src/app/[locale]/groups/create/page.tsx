'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Camera, Loader2, Globe, Lock, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'cars', label: 'Cars' },
  { value: 'simracing', label: 'Sim Racing' },
  { value: 'tuning', label: 'Tuning' },
  { value: 'meets', label: 'Meets & Events' },
  { value: 'brand', label: 'Brand Specific' },
  { value: 'regional', label: 'Regional' },
  { value: 'other', label: 'Other' },
]

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see and join', icon: Globe },
  { value: 'private', label: 'Private', description: 'Anyone can see, but must request to join', icon: Lock },
  { value: 'secret', label: 'Secret', description: 'Only members can see the group', icon: EyeOff },
]

export default function CreateGroupPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const { authenticated, user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
  })
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = async (file: File, type: 'cover' | 'avatar') => {
    if (!user) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `groups/${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('machinebio-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('machinebio-photos')
        .getPublicUrl(filePath)

      if (type === 'cover') {
        setCoverImage(publicUrl)
      } else {
        setAvatar(publicUrl)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Group name is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          coverImage,
          avatar,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create group')
      }

      const data = await res.json()
      router.push(`/${locale}/groups/${data.group.slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    router.push(`/${locale}/login`)
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/groups`}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">Create Group</h1>
            <p className="text-zinc-400 text-sm">Start a new community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Cover Image</label>
            <div className="relative h-40 bg-gradient-to-br from-orange-600/20 to-zinc-800 rounded-xl overflow-hidden group">
              {coverImage && (
                <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm">Upload Cover</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'cover')
                  }}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Group Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden group">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-zinc-500" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, 'avatar')
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-sm text-zinc-500">Square image recommended</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. BMW M Enthusiasts"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="What is this group about?"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Privacy</label>
            <div className="space-y-3">
              {PRIVACY_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.privacy === option.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={formData.privacy === option.value}
                      onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                      className="hidden"
                    />
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      formData.privacy === option.value ? 'text-orange-400' : 'text-zinc-500'
                    }`} />
                    <div>
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-sm text-zinc-400">{option.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/groups`}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-center font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
