'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, MapPin, Loader2, Camera } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

export default function NewSpotPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.spots

  const { user, authenticated, loading: authLoading } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isChallenge, setIsChallenge] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push(`/${locale}/login`)
    }
  }, [authenticated, authLoading, locale, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/spots/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('machinebio-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('machinebio-photos')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)

        // Try to reverse geocode to get location name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          const data = await res.json()
          if (data.address) {
            const { city, town, village, state, country } = data.address
            const locationParts = [city || town || village, state, country].filter(Boolean)
            setLocationName(locationParts.join(', '))
          }
        } catch {
          // Fallback to coordinates if reverse geocoding fails
          setLocationName(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        }
        setDetectingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Failed to detect location')
        setDetectingLocation(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!imageUrl) {
      setError(t.errors.imageRequired)
      return
    }

    if (isChallenge && !correctAnswer.trim()) {
      setError(t.errors.answerRequired)
      return
    }

    if (!isChallenge && (!make.trim() || !model.trim())) {
      setError(t.errors.makeModelRequired)
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          caption: caption.trim() || null,
          locationName: locationName.trim() || null,
          latitude,
          longitude,
          isChallenge,
          correctAnswer: isChallenge ? correctAnswer.trim() : null,
          make: isChallenge ? null : make.trim(),
          model: isChallenge ? null : model.trim(),
          year: year ? parseInt(year) : null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/${locale}/spots/${data.spot.id}`)
      } else {
        const data = await res.json()
        setError(data.error || t.errors.failed)
      }
    } catch {
      setError(t.errors.failed)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/${locale}/spots`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Camera className="w-8 h-8 text-orange-500" />
            {t.newSpot}
          </h1>
          <p className="text-zinc-400 mt-1">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t.uploadPhoto} *
            </label>
            {imageUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700">
                <img src={imageUrl} alt="Spot preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-black/60 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={`cursor-pointer block aspect-video rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:border-orange-500 hover:text-orange-400 hover:bg-zinc-800/50 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                {uploading ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-10 h-10" />
                    <span className="text-sm font-medium">{t.uploadPhoto}</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t.location}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t.locationPlaceholder}
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white hover:border-orange-500 transition-colors disabled:opacity-50"
              >
                {detectingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{t.detectLocation}</p>
          </div>

          {/* Challenge Toggle */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChallenge}
                onChange={(e) => setIsChallenge(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900"
              />
              <div>
                <span className="text-white font-medium">{t.isChallenge}</span>
                <p className="text-sm text-zinc-500 mt-0.5">{t.challengeHint}</p>
              </div>
            </label>
          </div>

          {/* Car Info or Correct Answer */}
          {isChallenge ? (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t.correctAnswer} *
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder={t.correctAnswerPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500 mt-1">{t.correctAnswerHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t.makeLabel} *
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder={t.makePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t.modelLabel} *
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={t.modelPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t.yearLabel}
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={t.yearPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t.caption}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.captionPlaceholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !imageUrl}>
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t.posting}
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                {t.submit}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
