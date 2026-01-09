'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, MessageCircle, Trash2, Loader2, HelpCircle, Check, X, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import GuessForm from '@/components/spots/GuessForm'
import RarityRating from '@/components/spots/RarityRating'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface SpotComment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  replies: SpotComment[]
  _count: { replies: number }
}

interface SpotGuess {
  id: string
  make: string
  model: string
  year: number | null
  isCorrect: boolean | null
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  createdAt: string
}

interface SpotData {
  id: string
  imageUrl: string
  thumbnail: string | null
  caption: string | null
  locationName: string | null
  latitude: number | null
  longitude: number | null
  make: string | null
  model: string | null
  year: number | null
  isChallenge: boolean
  isIdentified: boolean
  revealedAt: string | null
  correctAnswer: string | null
  avgRarity: number | null
  userRating: number | null
  userGuess: {
    make: string
    model: string
    year: number | null
    isCorrect: boolean | null
  } | null
  spotter: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  guesses: SpotGuess[]
  _count: {
    guesses: number
    comments: number
    ratings: number
  }
  isOwner: boolean
  createdAt: string
}

export default function SpotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const spotId = params.id as string
  const dict = getDictionary(locale)
  const t = dict.spots

  const { user, authenticated, loading: authLoading } = useAuth()

  const [spot, setSpot] = useState<SpotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<SpotComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [ratingSpot, setRatingSpot] = useState(false)

  useEffect(() => {
    fetchSpot()
  }, [spotId])

  const fetchSpot = async () => {
    try {
      const res = await fetch(`/api/spots/${spotId}`)
      if (res.ok) {
        const data = await res.json()
        setSpot(data.spot)
        fetchComments()
      } else {
        router.push(`/${locale}/spots`)
      }
    } catch {
      router.push(`/${locale}/spots`)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/spots/${spotId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleReveal = async () => {
    if (!spot || revealing) return
    if (!confirm('Reveal the answer? This cannot be undone.')) return

    setRevealing(true)
    try {
      const res = await fetch(`/api/spots/${spotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reveal: true }),
      })

      if (res.ok) {
        fetchSpot() // Refresh to get updated data
      }
    } catch (error) {
      console.error('Failed to reveal:', error)
    } finally {
      setRevealing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t.confirmDelete)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/spots/${spotId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push(`/${locale}/spots`)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleGuessSubmitted = () => {
    fetchSpot() // Refresh to show user's guess
  }

  const handleRate = async (rating: number) => {
    if (!authenticated || ratingSpot) return

    setRatingSpot(true)
    try {
      const res = await fetch(`/api/spots/${spotId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      if (res.ok) {
        const data = await res.json()
        setSpot(prev => prev ? {
          ...prev,
          userRating: data.rating,
          avgRarity: data.avgRating,
          _count: { ...prev._count, ratings: data.ratingCount },
        } : null)
      }
    } catch (error) {
      console.error('Failed to rate:', error)
    } finally {
      setRatingSpot(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/spots/${spotId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.comment, ...comments])
        setNewComment('')
        setSpot(prev => prev ? {
          ...prev,
          _count: { ...prev._count, comments: prev._count.comments + 1 },
        } : null)
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!spot) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-zinc-400">Spot not found</p>
      </div>
    )
  }

  const isRevealed = !!spot.revealedAt
  const carName = spot.isIdentified && spot.make
    ? `${spot.make} ${spot.model || ''}${spot.year ? ` (${spot.year})` : ''}`
    : null
  const canGuess = authenticated && spot.isChallenge && !isRevealed && !spot.userGuess && !spot.isOwner

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/${locale}/spots`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-800">
              <img
                src={spot.imageUrl}
                alt={spot.caption || 'Car spot'}
                className="w-full aspect-[4/3] object-cover"
              />

              {/* Challenge badge */}
              {spot.isChallenge && (
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 ${
                  isRevealed
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
                }`}>
                  {isRevealed ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t.challengeRevealed}
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4" />
                      Challenge
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Car info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              {carName ? (
                <h2 className="text-2xl font-bold text-white">{carName}</h2>
              ) : spot.isChallenge && !isRevealed ? (
                <h2 className="text-2xl font-bold text-orange-400">What car is this?</h2>
              ) : (
                <h2 className="text-2xl font-bold text-zinc-500">Unknown car</h2>
              )}

              {/* Revealed answer */}
              {spot.isChallenge && isRevealed && spot.correctAnswer && (
                <p className="text-green-400 mt-2">
                  Answer: <span className="font-semibold">{spot.correctAnswer}</span>
                </p>
              )}

              {/* Location */}
              {spot.locationName && (
                <div className="flex items-center gap-2 text-zinc-400 mt-3">
                  <MapPin className="w-4 h-4" />
                  <span>{spot.locationName}</span>
                </div>
              )}

              {/* Caption */}
              {spot.caption && (
                <p className="text-zinc-300 mt-4">{spot.caption}</p>
              )}

              {/* Spotter info */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                <Link href={`/${locale}/u/${spot.spotter.username}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden">
                    {spot.spotter.avatar ? (
                      <img src={spot.spotter.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {spot.spotter.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/${locale}/u/${spot.spotter.username}`} className="text-white font-medium hover:text-orange-400">
                    {spot.spotter.name || spot.spotter.username}
                  </Link>
                  <p className="text-sm text-zinc-500">{formatTimeAgo(spot.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* User's guess result */}
            {spot.userGuess && (
              <div className={`bg-zinc-900 border rounded-xl p-4 ${
                spot.userGuess.isCorrect === true
                  ? 'border-green-500/50'
                  : spot.userGuess.isCorrect === false
                  ? 'border-red-500/50'
                  : 'border-zinc-800'
              }`}>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2">{t.yourGuess}</h3>
                <p className="text-white font-medium">
                  {spot.userGuess.make} {spot.userGuess.model}
                  {spot.userGuess.year && ` (${spot.userGuess.year})`}
                </p>
                {isRevealed && spot.userGuess.isCorrect !== null && (
                  <p className={`mt-2 font-semibold ${
                    spot.userGuess.isCorrect ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {spot.userGuess.isCorrect ? t.correctGuess : t.incorrectGuess}
                  </p>
                )}
                {!isRevealed && (
                  <p className="text-zinc-500 text-sm mt-2">{t.waitingForReveal}</p>
                )}
              </div>
            )}

            {/* Guess form */}
            {canGuess && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <GuessForm
                  spotId={spotId}
                  onGuessSubmitted={handleGuessSubmitted}
                  translations={{
                    makeLabel: t.makeLabel,
                    makePlaceholder: t.makePlaceholder,
                    modelLabel: t.modelLabel,
                    modelPlaceholder: t.modelPlaceholder,
                    yearLabel: t.yearLabel,
                    yearPlaceholder: t.yearPlaceholder,
                    guess: t.guess,
                    guessing: t.guessing,
                  }}
                />
              </div>
            )}

            {/* Guesses list */}
            {spot.isChallenge && spot.guesses.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-orange-500" />
                  {t.guesses} ({spot.guesses.length})
                </h3>
                <div className="space-y-3">
                  {spot.guesses.map((guess) => (
                    <div key={guess.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                          {guess.user.avatar ? (
                            <img src={guess.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
                              <span className="text-xs font-bold text-white">
                                {guess.user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">
                            {guess.make} {guess.model}
                            {guess.year && ` (${guess.year})`}
                          </p>
                          <p className="text-xs text-zinc-500">{guess.user.username}</p>
                        </div>
                      </div>
                      {isRevealed && guess.isCorrect !== null && (
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          guess.isCorrect
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {guess.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-orange-500" />
                {t.comments} ({spot._count.comments})
              </h3>

              {/* Comment form */}
              {authenticated && (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={submittingComment || !newComment.trim()}
                        >
                          {submittingComment ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments list */}
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/${locale}/u/${comment.author.username}`} className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
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
                      </Link>
                      <div className="flex-1">
                        <div className="bg-zinc-800 rounded-lg px-3 py-2">
                          <Link href={`/${locale}/u/${comment.author.username}`} className="text-sm font-semibold text-white hover:text-orange-400">
                            {comment.author.name || comment.author.username}
                          </Link>
                          <p className="text-sm text-zinc-300">{comment.content}</p>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1 px-1">
                          {formatTimeAgo(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rarity rating */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4">{t.rarity}</h3>
              <RarityRating
                value={spot.userRating}
                avgRating={spot.avgRarity}
                ratingCount={spot._count.ratings}
                onChange={handleRate}
                readonly={!authenticated || ratingSpot}
              />
              <p className="text-xs text-zinc-500 mt-3 text-center">{t.rarityHint}</p>
            </div>

            {/* Owner actions */}
            {spot.isOwner && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                {spot.isChallenge && !isRevealed && (
                  <Button
                    onClick={handleReveal}
                    disabled={revealing}
                    className="w-full"
                  >
                    {revealing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.revealing}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        {t.reveal}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.deleteSpot}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
