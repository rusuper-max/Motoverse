'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Car, Plus, Gauge, Calendar, Fuel, Settings2, Trash2, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface CarData {
  id: string
  year: number
  nickname: string | null
  description: string | null
  image: string | null
  mileage: number | null
  engine: string | null
  transmission: string | null
  drivetrain: string | null
  fuelType: string | null
  horsepower: number | null
  color: string | null
  generation: {
    id: string
    name: string
    displayName: string | null
    model: {
      id: string
      name: string
      make: {
        id: string
        name: string
        logo: string | null
      }
    }
  } | null
  engineConfig: {
    id: string
    name: string
  } | null
  _count: {
    posts: number
  }
}

export default function GaragePage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.garage

  const { authenticated, loading: authLoading } = useAuth()
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!authenticated) {
      router.push(`/${locale}/login`)
      return
    }

    fetchCars()
  }, [authenticated, authLoading, locale, router])

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCars(data.cars)
      } else {
        setError('Failed to load cars')
      }
    } catch {
      setError('Failed to load cars')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (carId: string) => {
    if (!confirm(t.confirmDelete)) return

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setCars(cars.filter((car) => car.id !== carId))
      }
    } catch {
      // Ignore errors
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
            <p className="text-zinc-400 mt-1">
              {cars.length > 0
                ? t.carCount.replace('{count}', String(cars.length))
                : t.noCars}
            </p>
          </div>
          <Link href={`/${locale}/garage/add`}>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              {t.addCar}
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Cars Grid */}
        {cars.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{t.noCars}</h2>
            <p className="text-zinc-400 mb-6">{t.addFirstCar}</p>
            <Link href={`/${locale}/garage/add`}>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                {t.addCar}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Car Image */}
                <div className="aspect-video bg-zinc-800 relative">
                  {car.image ? (
                    <img
                      src={car.image}
                      alt={car.nickname || `${car.generation?.model.make.name} ${car.generation?.model.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-zinc-700" />
                    </div>
                  )}
                  {/* Year badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-sm font-medium text-white">
                    {car.year}
                  </div>
                  {/* Generation badge */}
                  {car.generation && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500/80 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
                      {car.generation.name}
                    </div>
                  )}
                </div>

                {/* Car Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {car.generation?.model.make.name} {car.generation?.model.name}
                      </h3>
                      {car.nickname && (
                        <p className="text-orange-400 text-sm">&quot;{car.nickname}&quot;</p>
                      )}
                      {car.engine && (
                        <p className="text-zinc-500 text-sm">{car.engine}</p>
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-zinc-400">
                    {car.horsepower && (
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        <span>{car.horsepower} {t.horsepower}</span>
                      </div>
                    )}
                    {car.mileage && (
                      <div className="flex items-center gap-1">
                        <Settings2 className="w-4 h-4" />
                        <span>{car.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                    {car.fuelType && (
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        <span className="capitalize">{car.fuelType}</span>
                      </div>
                    )}
                    {car._count.posts > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{car._count.posts} {t.posts}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                    <Link href={`/${locale}/garage/${car.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        {t.viewCar}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(car.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
