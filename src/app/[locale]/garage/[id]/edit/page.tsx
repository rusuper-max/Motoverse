'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, Save, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface CarData {
  id: string
  year: number
  nickname: string | null
  description: string | null
  image: string | null
  images: string[]
  mileage: number | null
  engine: string | null
  transmission: string | null
  drivetrain: string | null
  fuelType: string | null
  horsepower: number | null
  torque: number | null
  color: string | null
  isPublic: boolean
  generation?: {
    name: string
    displayName: string | null
    startYear: number
    endYear: number | null
    model: {
      name: string
      make: { name: string }
    }
  }
  owner: {
    id: string
    username: string
  }
}

export default function EditCarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const carId = params.id as string
  const dict = getDictionary(locale)
  const t = dict.garage

  const { user, authenticated, loading: authLoading } = useAuth()

  const [car, setCar] = useState<CarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state
  const [year, setYear] = useState('')
  const [nickname, setNickname] = useState('')
  const [description, setDescription] = useState('')
  const [engine, setEngine] = useState('')
  const [transmission, setTransmission] = useState('')
  const [drivetrain, setDrivetrain] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [horsepower, setHorsepower] = useState('')
  const [torque, setTorque] = useState('')
  const [color, setColor] = useState('')
  const [mileage, setMileage] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!authenticated) {
      router.push(`/${locale}/login`)
      return
    }
    fetchCar()
  }, [authenticated, authLoading, locale, router, carId])

  const fetchCar = async () => {
    try {
      const res = await fetch(`/api/cars/${carId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const carData = data.car as CarData

        // Check if user is owner
        if (carData.owner.id !== user?.id) {
          router.push(`/${locale}/garage/${carId}`)
          return
        }

        setCar(carData)
        // Initialize form with existing data
        setYear(carData.year?.toString() || '')
        setNickname(carData.nickname || '')
        setDescription(carData.description || '')
        setEngine(carData.engine || '')
        setTransmission(carData.transmission || '')
        setDrivetrain(carData.drivetrain || '')
        setFuelType(carData.fuelType || '')
        setHorsepower(carData.horsepower?.toString() || '')
        setTorque(carData.torque?.toString() || '')
        setColor(carData.color || '')
        setMileage(carData.mileage?.toString() || '')
        setImages(carData.images || (carData.image ? [carData.image] : []))
        setIsPublic(carData.isPublic ?? true)
      } else {
        router.push(`/${locale}/garage`)
      }
    } catch {
      router.push(`/${locale}/garage`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nickname: nickname || null,
          description: description || null,
          engine: engine || null,
          transmission: transmission || null,
          drivetrain: drivetrain || null,
          fuelType: fuelType || null,
          horsepower: horsepower || null,
          torque: torque || null,
          color: color || null,
          mileage: mileage || null,
          image: images.length > 0 ? images[0] : null,
          isPublic,
        }),
      })

      if (res.ok) {
        router.push(`/${locale}/garage/${carId}`)
      } else {
        const data = await res.json()
        setError(data.message || t.errors?.failed || 'Failed to save changes')
      }
    } catch {
      setError(t.errors?.failed || 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        router.push(`/${locale}/garage`)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to delete car')
      }
    } catch {
      setError('Failed to delete car')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Generate year options based on generation
  const minYear = car?.generation?.startYear || 1950
  const maxYear = car?.generation?.endYear || new Date().getFullYear() + 1
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  if (loading || authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-zinc-400">Car not found</p>
      </div>
    )
  }

  const carName = `${car.generation?.model.make.name} ${car.generation?.model.name}`

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/${locale}/garage/${carId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Car
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Edit Car</h1>
          <p className="text-zinc-400 mt-1">{carName}</p>
        </div>

        {/* Car summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
            {car.image ? (
              <img src={car.image} alt={carName} className="w-full h-full object-cover" />
            ) : (
              <Car className="w-6 h-6 text-orange-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {car.nickname || carName}
            </p>
            <p className="text-zinc-500 text-sm">
              {car.year} {car.generation?.displayName || car.generation?.name}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t.year}</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t.nickname}</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your car..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Two columns for specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Engine */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.engine}</label>
              <input
                type="text"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                placeholder={t.enginePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Horsepower */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.horsepowerLabel}</label>
              <input
                type="number"
                value={horsepower}
                onChange={(e) => setHorsepower(e.target.value)}
                placeholder={t.horsepowerPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Torque */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Torque (Nm)</label>
              <input
                type="number"
                value={torque}
                onChange={(e) => setTorque(e.target.value)}
                placeholder="e.g., 350"
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.transmission}</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="manual">{t.transmissions.manual}</option>
                <option value="automatic">{t.transmissions.automatic}</option>
                <option value="cvt">{t.transmissions.cvt}</option>
                <option value="dct">{t.transmissions.dct}</option>
                <option value="other">{t.transmissions.other}</option>
              </select>
            </div>

            {/* Drivetrain */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.drivetrain}</label>
              <select
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="fwd">{t.drivetrains.fwd}</option>
                <option value="rwd">{t.drivetrains.rwd}</option>
                <option value="awd">{t.drivetrains.awd}</option>
                <option value="4wd">{t.drivetrains['4wd']}</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.fuelType}</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select</option>
                <option value="petrol">{t.fuelTypes.petrol}</option>
                <option value="diesel">{t.fuelTypes.diesel}</option>
                <option value="electric">{t.fuelTypes.electric}</option>
                <option value="hybrid">{t.fuelTypes.hybrid}</option>
                <option value="lpg">{t.fuelTypes.lpg}</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.color}</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder={t.colorPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.mileageLabel}</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder={t.mileagePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Photos */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Photos (Max 10)</label>
              <ImageUpload
                value={images}
                onChange={(newImages) => setImages(newImages)}
                onRemove={(urlToRemove) => setImages(prev => prev.filter(url => url !== urlToRemove))}
                bucket="motoverse-photos"
                folderPath="cars"
                maxFiles={10}
              />
            </div>

            {/* Visibility */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900"
                />
                <span className="text-zinc-300">Make this car visible to the public</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Car
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-2">Delete Car?</h3>
              <p className="text-zinc-400 mb-6">
                Are you sure you want to delete this car? This action cannot be undone and will remove all associated posts and history.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
