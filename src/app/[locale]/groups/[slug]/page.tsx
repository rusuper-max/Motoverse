'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Lock, Globe, Settings, UserPlus, UserMinus, Send,
  Loader2, MessageSquare, Heart, MoreHorizontal, Trash2,
  ArrowLeft, Image as ImageIcon, Clock
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface Group {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  avatar: string | null
  privacy: string
  category: string | null
  memberCount: number
  postCount: number
  isMember: boolean
  userRole: string | null
  pendingRequest: { status: string; createdAt: string } | null
  members: {
    id: string
    role: string
    user: { id: string; username: string; name: string | null; avatar: string | null }
  }[]
  _count: { members: number; posts: number }
}

interface GroupPost {
  id: string
  content: string
  images: string[]
  isPinned: boolean
  createdAt: string
  author: { id: string; username: string; name: string | null; avatar: string | null }
  isLiked: boolean
  _count: { comments: number; likes: number }
}

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale as string || 'en'
  const slug = params?.slug as string
  const { authenticated, user } = useAuth()
  const supabase = createClient()

  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [postImages, setPostImages] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${slug}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push(`/${locale}/groups`)
          return
        }
        throw new Error('Failed to fetch group')
      }
      const data = await res.json()
      setGroup(data.group)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, router, locale])

  const fetchPosts = useCallback(async () => {
    if (!group) return
    setPostsLoading(true)
    try {
      const res = await fetch(`/api/groups/${slug}/posts`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setPostsLoading(false)
    }
  }, [slug, group])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  useEffect(() => {
    if (group && (group.privacy === 'public' || group.isMember)) {
      fetchPosts()
    }
  }, [group, fetchPosts])

  const handleJoin = async () => {
    if (!authenticated) {
      router.push(`/${locale}/login`)
      return
    }

    setJoining(true)
    try {
      const res = await fetch(`/api/groups/${slug}/join`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        fetchGroup()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return

    setJoining(true)
    try {
      const res = await fetch(`/api/groups/${slug}/join`, { method: 'DELETE' })
      if (res.ok) {
        fetchGroup()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setJoining(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!user) return
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `groups/posts/${fileName}`

      const { error } = await supabase.storage
        .from('machinebio-photos')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('machinebio-photos')
        .getPublicUrl(filePath)

      setPostImages([...postImages, publicUrl])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePost = async () => {
    if (!newPost.trim() && postImages.length === 0) return

    setPosting(true)
    try {
      const res = await fetch(`/api/groups/${slug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost, images: postImages }),
      })

      if (res.ok) {
        setNewPost('')
        setPostImages([])
        fetchPosts()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setPosting(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const res = await fetch(`/api/groups/${slug}/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setPosts(posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: data.liked, _count: { ...p._count, likes: data.likeCount } }
            : p
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!group) {
    return null
  }

  const canPost = group.isMember
  const isAdmin = group.userRole && ['owner', 'admin'].includes(group.userRole)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Cover Image */}
      <div className="h-48 sm:h-64 bg-gradient-to-br from-orange-600/20 to-zinc-800 relative">
        {group.coverImage && (
          <img src={group.coverImage} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />

        {/* Back Button */}
        <Link
          href={`/${locale}/groups`}
          className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Settings Button */}
        {isAdmin && (
          <Link
            href={`/${locale}/groups/${slug}/settings`}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Group Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-xl bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center overflow-hidden">
            {group.avatar ? (
              <img src={group.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10 text-zinc-500" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white font-heading">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                  {group.privacy === 'private' ? (
                    <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> Private</span>
                  ) : (
                    <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Public</span>
                  )}
                  <span>{group.memberCount} members</span>
                  <span>{group.postCount} posts</span>
                </div>
              </div>

              {/* Join/Leave Button */}
              <div>
                {group.isMember ? (
                  <button
                    onClick={handleLeave}
                    disabled={joining || group.userRole === 'owner'}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                    {group.userRole === 'owner' ? 'Owner' : 'Leave'}
                  </button>
                ) : group.pendingRequest ? (
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Pending
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>

            {group.description && (
              <p className="text-zinc-400 mt-3">{group.description}</p>
            )}
          </div>
        </div>

        {/* Members Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Members</h2>
            <Link
              href={`/${locale}/groups/${slug}/members`}
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              See all
            </Link>
          </div>
          <div className="flex -space-x-2">
            {group.members.slice(0, 8).map((member) => (
              <Link
                key={member.id}
                href={`/${locale}/u/${member.user.username}`}
                className="relative"
                title={member.user.name || member.user.username}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 text-white text-sm font-bold">
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {group.memberCount > 8 && (
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-xs text-zinc-400">
                +{group.memberCount - 8}
              </div>
            )}
          </div>
        </div>

        {/* Post Composer */}
        {canPost && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with the group..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
            />

            {/* Image Previews */}
            {postImages.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {postImages.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPostImages(postImages.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors">
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                <span className="text-sm">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={uploadingImage}
                />
              </label>

              <button
                onClick={handlePost}
                disabled={posting || (!newPost.trim() && postImages.length === 0)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {group.privacy !== 'public' && !group.isMember ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">This group is private</h2>
            <p className="text-zinc-400">Join the group to see posts</p>
          </div>
        ) : postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No posts yet</h2>
            <p className="text-zinc-400">Be the first to post something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${
                  post.isPinned ? 'border-orange-500/50' : ''
                }`}
              >
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/${locale}/u/${post.author.username}`}>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
                          {post.author.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={`/${locale}/u/${post.author.username}`}
                      className="text-white font-medium hover:text-orange-400"
                    >
                      {post.author.name || post.author.username}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {post.isPinned && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                      Pinned
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>

                {/* Images */}
                {post.images.length > 0 && (
                  <div className={`grid gap-2 mt-3 ${
                    post.images.length === 1 ? 'grid-cols-1' :
                    post.images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 sm:grid-cols-3'
                  }`}>
                    {post.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => authenticated && handleLike(post.id, post.isLiked)}
                    className={`flex items-center gap-2 text-sm ${
                      post.isLiked ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'
                    } transition-colors`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post._count.likes}
                  </button>
                  <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    {post._count.comments}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
