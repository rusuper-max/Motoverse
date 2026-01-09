'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, X, MessageCircle, Upload, Trash2, ChevronLeft, ChevronRight, Loader2, ImagePlus } from 'lucide-react'
import RevLimiterRating from './ui/RevLimiterRating'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface PhotoAuthor {
  id: string
  username: string
  name: string | null
  avatar: string | null
}

interface PhotoComment {
  id: string
  content: string
  createdAt: string
  author: PhotoAuthor
  isLiked: boolean
  _count: { likes: number; replies: number }
  replies: PhotoComment[]
}

interface Photo {
  id: string
  url: string
  thumbnail: string | null
  caption: string | null
  createdAt: string
  uploader: PhotoAuthor
  avgRating: number | null
  userRating: number | null
  ratingCount: number
  commentCount: number
}

interface PhotoAlbumProps {
  carId: string
  isOwner: boolean
  locale: string
}

export default function PhotoAlbum({ carId, isOwner, locale }: PhotoAlbumProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [uploadCaption, setUploadCaption] = useState('')

  // Photo viewer state
  const [photoComments, setPhotoComments] = useState<PhotoComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [ratingPhoto, setRatingPhoto] = useState(false)

  useEffect(() => {
    fetchPhotos()
  }, [carId])

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/cars/${carId}/photos`)
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotoComments = async (photoId: string) => {
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/cars/${carId}/photos/${photoId}/comments`)
      const data = await res.json()
      setPhotoComments(data.comments || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const openPhoto = (photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setSelectedIndex(index)
    fetchPhotoComments(photo.id)
  }

  const closePhoto = () => {
    setSelectedPhoto(null)
    setPhotoComments([])
    setNewComment('')
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? (selectedIndex - 1 + photos.length) % photos.length
      : (selectedIndex + 1) % photos.length
    setSelectedIndex(newIndex)
    const newPhoto = photos[newIndex]
    setSelectedPhoto(newPhoto)
    fetchPhotoComments(newPhoto.id)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user?.id) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/albums/${carId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('machinebio-photos')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('machinebio-photos')
          .getPublicUrl(filePath)

        // Save to database
        const res = await fetch(`/api/cars/${carId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: publicUrl,
            caption: uploadCaption.trim() || null,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setPhotos(prev => [data.photo, ...prev])
        }
      }
      setUploadCaption('')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return

    try {
      const res = await fetch(`/api/cars/${carId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPhotos(photos.filter(p => p.id !== photoId))
        if (selectedPhoto?.id === photoId) {
          closePhoto()
        }
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
    }
  }

  const handleRate = async (rating: number) => {
    if (!selectedPhoto || ratingPhoto) return

    setRatingPhoto(true)
    try {
      const res = await fetch(`/api/cars/${carId}/photos/${selectedPhoto.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      if (res.ok) {
        const data = await res.json()
        // Update the photo in state
        const updatedPhoto = {
          ...selectedPhoto,
          userRating: data.rating,
          avgRating: data.avgRating,
          ratingCount: data.ratingCount,
        }
        setSelectedPhoto(updatedPhoto)
        setPhotos(photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p))
      }
    } catch (error) {
      console.error('Failed to rate photo:', error)
    } finally {
      setRatingPhoto(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhoto || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/cars/${carId}/photos/${selectedPhoto.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setPhotoComments([data.comment, ...photoComments])
        setNewComment('')
        // Update comment count
        const updatedPhoto = { ...selectedPhoto, commentCount: selectedPhoto.commentCount + 1 }
        setSelectedPhoto(updatedPhoto)
        setPhotos(photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p))
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setSubmittingComment(false)
    }
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

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-white">Photo Album</h3>
            <span className="text-sm text-zinc-500">({photos.length})</span>
          </div>
          {isOwner && (
            <label className={`flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Add Photos
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="p-8 text-center">
            <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No photos yet</p>
            {isOwner && (
              <p className="text-sm text-zinc-600 mt-1">
                Add photos to showcase your car!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => openPhoto(photo, index)}
                className="relative aspect-square cursor-pointer group overflow-hidden bg-zinc-800"
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {photo.avgRating !== null && (
                    <div className="text-white font-bold text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                      {(photo.avgRating / 1000).toFixed(1)}k RPM
                    </div>
                  )}
                </div>
                {/* Rating indicator */}
                {photo.avgRating !== null && photo.avgRating >= 8000 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex" onClick={closePhoto}>
          {/* Close button - positioned to the left of the sidebar */}
          <button
            onClick={closePhoto}
            className="absolute top-4 right-[340px] p-2 text-zinc-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigatePhoto('prev') }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigatePhoto('next') }}
                className="absolute right-[340px] top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main image area */}
          <div
            className="flex-1 flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || ''}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Right sidebar */}
          <div
            className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo info */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden">
                  {selectedPhoto.uploader.avatar ? (
                    <img src={selectedPhoto.uploader.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {selectedPhoto.uploader.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {selectedPhoto.uploader.name || selectedPhoto.uploader.username}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatTimeAgo(selectedPhoto.createdAt)}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    className="ml-auto p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedPhoto.caption && (
                <p className="text-zinc-300 text-sm">{selectedPhoto.caption}</p>
              )}
            </div>

            {/* Rev Limiter Rating */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex flex-col items-center">
                <RevLimiterRating
                  value={selectedPhoto.userRating ?? selectedPhoto.avgRating}
                  onChange={handleRate}
                  readonly={ratingPhoto}
                  size="md"
                />
                <div className="mt-2 text-center">
                  {selectedPhoto.avgRating !== null ? (
                    <p className="text-sm text-zinc-400">
                      Average: <span className="text-orange-400 font-semibold">
                        {(selectedPhoto.avgRating / 1000).toFixed(1)}k RPM
                      </span>
                      <span className="text-zinc-600"> ({selectedPhoto.ratingCount} ratings)</span>
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500">Be the first to rate!</p>
                  )}
                  {selectedPhoto.userRating !== null && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Your rating: {(selectedPhoto.userRating / 1000).toFixed(1)}k
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{selectedPhoto.commentCount} comments</span>
                </div>
              </div>

              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {photoComments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                          {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                              <span className="text-xs font-bold text-white">
                                {comment.author.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-zinc-800 rounded-lg px-3 py-2">
                            <p className="text-sm font-semibold text-white">
                              {comment.author.name || comment.author.username}
                            </p>
                            <p className="text-sm text-zinc-300">{comment.content}</p>
                          </div>
                          <p className="text-xs text-zinc-600 mt-1 px-1">
                            {formatTimeAgo(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {photoComments.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      No comments yet. Be the first!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleSubmitComment} className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
