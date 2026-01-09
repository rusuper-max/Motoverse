'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Camera,
  Lock,
  Bell,
  Shield,
  Eye,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Loader2,
  ArrowLeft,
  Check,
  Upload,
  Car,
  X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

const ACCOUNT_TYPES = [
  { value: 'enthusiast', label: 'Enthusiast', description: 'Car lover and community member' },
  { value: 'mechanic', label: 'Mechanic', description: 'Professional or hobbyist mechanic' },
  { value: 'tuner', label: 'Tuner', description: 'Performance tuning specialist' },
  { value: 'dealer', label: 'Dealer', description: 'Car dealership or sales' },
  { value: 'racer', label: 'Racer', description: 'Track day enthusiast or professional' },
  { value: 'collector', label: 'Collector', description: 'Classic or exotic car collector' },
]

type SettingsTab = 'profile' | 'account' | 'privacy' | 'notifications'

interface UserSettings {
  id: string
  username: string
  email: string
  name: string | null
  bio: string | null
  avatar: string | null
  coverImage: string | null
  location: string | null
  country: string | null
  accountType: string | null
  website: string | null
  socialLinks: {
    instagram?: string
    youtube?: string
    tiktok?: string
    x?: string
  } | null
  isVerified: boolean
  role: string
}

interface GarageCar {
  id: string
  nickname: string | null
  image: string | null
  generation: {
    model: {
      name: string
      make: { name: string }
    }
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const { user: authUser, loading: authLoading, refresh: refreshAuth } = useAuth()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [user, setUser] = useState<UserSettings | null>(null)
  const [garageCars, setGarageCars] = useState<GarageCar[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    country: '',
    accountType: '',
    website: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: '',
      x: '',
    }
  })

  // Image upload state
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  // Email/Password change state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailChanging, setEmailChanging] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)

  const supabase = createClient()

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!authUser?.username) return

    try {
      const res = await fetch(`/api/users/${authUser.username}`)
      if (!res.ok) throw new Error('Failed to fetch user')

      const data = await res.json()
      setUser(data.user)
      setFormData({
        name: data.user.name || '',
        bio: data.user.bio || '',
        location: data.user.location || '',
        country: data.user.country || '',
        accountType: data.user.accountType || '',
        website: data.user.website || '',
        socialLinks: {
          instagram: data.user.socialLinks?.instagram || '',
          youtube: data.user.socialLinks?.youtube || '',
          tiktok: data.user.socialLinks?.tiktok || '',
          x: data.user.socialLinks?.x || '',
        }
      })
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }, [authUser?.username])

  // Fetch user's cars for default avatar option
  const fetchGarageCars = useCallback(async () => {
    try {
      const res = await fetch('/api/cars?limit=10')
      if (res.ok) {
        const data = await res.json()
        setGarageCars(data.cars || [])
      }
    } catch (error) {
      console.error('Failed to fetch garage cars:', error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace(`/${locale}/login`)
    }
  }, [authLoading, authUser, router, locale])

  useEffect(() => {
    if (authUser) {
      fetchUserData()
      fetchGarageCars()
    }
  }, [authUser, fetchUserData, fetchGarageCars])

  // Handle image upload
  const handleImageUpload = async (
    file: File,
    type: 'avatar' | 'cover'
  ) => {
    if (!authUser?.id) return

    const setUploading = type === 'avatar' ? setAvatarUploading : setCoverUploading
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const folderPath = type === 'avatar' ? 'avatars' : 'covers'
      const filePath = `${authUser.id}/${folderPath}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('motoverse_photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('motoverse_photos')
        .getPublicUrl(filePath)

      // Update user profile with new image URL
      const updateField = type === 'avatar' ? 'avatar' : 'coverImage'
      const res = await fetch(`/api/users/${authUser.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [updateField]: publicUrl }),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      // Update local state
      setUser(prev => prev ? { ...prev, [updateField]: publicUrl } : null)
      setSaveMessage({ type: 'success', text: `${type === 'avatar' ? 'Profile photo' : 'Cover image'} updated!` })
      refreshAuth()
    } catch (error) {
      console.error('Upload error:', error)
      setSaveMessage({ type: 'error', text: 'Failed to upload image' })
    } finally {
      setUploading(false)
    }
  }

  // Handle using car photo as avatar
  const handleUseCarAsAvatar = async (carImageUrl: string) => {
    if (!authUser?.username) return

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${authUser.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: carImageUrl }),
      })

      if (!res.ok) throw new Error('Failed to update avatar')

      setUser(prev => prev ? { ...prev, avatar: carImageUrl } : null)
      setSaveMessage({ type: 'success', text: 'Avatar updated to car photo!' })
      refreshAuth()
    } catch (error) {
      console.error('Error:', error)
      setSaveMessage({ type: 'error', text: 'Failed to update avatar' })
    } finally {
      setSaving(false)
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!authUser?.username) return

    setSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch(`/api/users/${authUser.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save')

      const data = await res.json()
      setUser(prev => prev ? { ...prev, ...data.user } : null)
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' })
      refreshAuth()
    } catch (error) {
      console.error('Save error:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a new email address' })
      return
    }

    setEmailChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error

      setSaveMessage({ type: 'success', text: 'Verification email sent to your new address. Please check your inbox.' })
      setShowEmailModal(false)
      setNewEmail('')
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to change email' })
    } finally {
      setEmailChanging(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Please fill in all password fields' })
      return
    }

    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setPasswordChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setSaveMessage({ type: 'success', text: 'Password changed successfully!' })
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally {
      setPasswordChanging(false)
    }
  }

  // Clear save message after delay
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Failed to load settings</p>
      </div>
    )
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/u/${user.username}`}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-sm text-zinc-400">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Save Message */}
            {saveMessage && (
              <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
                saveMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {saveMessage.text}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Photos Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Profile Photos
                    </h2>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Cover Image */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">Cover Image</label>
                      <div className="relative h-40 bg-gradient-to-br from-orange-600/20 to-zinc-800 rounded-xl overflow-hidden group">
                        {user.coverImage && (
                          <img
                            src={user.coverImage}
                            alt="Cover"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          {coverUploading ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          ) : (
                            <div className="flex flex-col items-center text-white">
                              <Upload className="w-8 h-8 mb-2" />
                              <span className="text-sm font-medium">Upload Cover Photo</span>
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
                            disabled={coverUploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">Profile Photo</label>
                      <div className="flex items-start gap-6">
                        <div className="relative group">
                          <div className="w-28 h-28 rounded-full bg-zinc-800 overflow-hidden border-4 border-zinc-700">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                                <span className="text-3xl font-bold text-white">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {avatarUploading ? (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                              <Camera className="w-6 h-6 text-white" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'avatar')
                              }}
                              disabled={avatarUploading}
                            />
                          </label>
                        </div>

                        {/* Use Car Photo */}
                        {garageCars.length > 0 && (
                          <div className="flex-1">
                            <p className="text-sm text-zinc-400 mb-2">Or use a photo from your garage:</p>
                            <div className="flex flex-wrap gap-2">
                              {garageCars.filter(car => car.image).slice(0, 4).map((car) => (
                                <button
                                  key={car.id}
                                  onClick={() => car.image && handleUseCarAsAvatar(car.image)}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-zinc-700 hover:border-orange-500 transition-colors group"
                                  title={car.nickname || `${car.generation.model.make.name} ${car.generation.model.name}`}
                                >
                                  <img
                                    src={car.image!}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Car className="w-4 h-4 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Basic Info Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Basic Information
                    </h2>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Account Type</label>
                        <select
                          value={formData.accountType}
                          onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="">Select your type...</option>
                          {ACCOUNT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        {formData.accountType && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {ACCOUNT_TYPES.find(t => t.value === formData.accountType)?.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        placeholder="Tell others about yourself and your cars..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Los Angeles"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="e.g. United States"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Social Links Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Social Links
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <Instagram className="w-4 h-4" /> Instagram
                        </label>
                        <input
                          type="text"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                          })}
                          placeholder="@username"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <Youtube className="w-4 h-4" /> YouTube
                        </label>
                        <input
                          type="text"
                          value={formData.socialLinks.youtube}
                          onChange={(e) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                          })}
                          placeholder="Channel URL"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <Twitter className="w-4 h-4" /> X (Twitter)
                        </label>
                        <input
                          type="text"
                          value={formData.socialLinks.x}
                          onChange={(e) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, x: e.target.value }
                          })}
                          placeholder="@username"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          TikTok
                        </label>
                        <input
                          type="text"
                          value={formData.socialLinks.tiktok}
                          onChange={(e) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                          })}
                          placeholder="@username"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Account Information
                    </h2>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400 cursor-not-allowed"
                        />
                        <span className="text-xs text-zinc-500">Cannot be changed</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400 cursor-not-allowed"
                        />
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="px-4 py-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-950/20 border border-red-900/30 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-900/30">
                    <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Delete Account</p>
                        <p className="text-sm text-zinc-400">Permanently delete your account and all data</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Profile Visibility
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <ToggleSetting
                      label="Show my location"
                      description="Display your city and country on your profile"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Show my email"
                      description="Allow others to see your email address"
                      defaultChecked={false}
                    />
                    <ToggleSetting
                      label="Public garage"
                      description="Allow non-followers to see your cars"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Show follower count"
                      description="Display how many followers you have"
                      defaultChecked={true}
                    />
                  </div>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Interactions
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <ToggleSetting
                      label="Allow messages from anyone"
                      description="Receive messages from non-followers"
                      defaultChecked={false}
                    />
                    <ToggleSetting
                      label="Allow comments on cars"
                      description="Let others comment on your car profiles"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Show online status"
                      description="Let others see when you're active"
                      defaultChecked={true}
                    />
                  </div>
                </section>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Push Notifications
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <ToggleSetting
                      label="New followers"
                      description="Get notified when someone follows you"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Post likes"
                      description="Get notified when someone likes your post"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Comments"
                      description="Get notified when someone comments"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Car ratings"
                      description="Get notified when someone rates your car"
                      defaultChecked={true}
                    />
                    <ToggleSetting
                      label="Event updates"
                      description="Get updates about events you're attending"
                      defaultChecked={true}
                    />
                  </div>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <ToggleSetting
                      label="Weekly digest"
                      description="Receive a weekly summary of activity"
                      defaultChecked={false}
                    />
                    <ToggleSetting
                      label="Marketing emails"
                      description="Receive news and feature updates"
                      defaultChecked={false}
                    />
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-2">Change Email Address</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Enter your new email address. You will receive a verification email to confirm the change.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Current Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">New Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="your.new.email@example.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setNewEmail('')
                }}
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                disabled={emailChanging}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChange}
                disabled={emailChanging || !newEmail.trim()}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {emailChanging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-2">Change Password</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Enter your new password. Make sure it&apos;s at least 8 characters long.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                disabled={passwordChanging}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordChanging || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordChanging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Toggle Setting Component
function ToggleSetting({
  label,
  description,
  defaultChecked = false,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  const [enabled, setEnabled] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? 'bg-orange-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
