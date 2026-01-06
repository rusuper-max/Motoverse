'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Gauge, Settings } from 'lucide-react'
import Card from '../ui/Card'

interface CarCardProps {
  car: {
    id: string
    make: string
    model: string
    year: number
    nickname: string | null
    image: string | null
    mileage: number | null
    engine: string | null
    horsepower: number | null
  }
  isOwner?: boolean
}

export default function CarCard({ car, isOwner = false }: CarCardProps) {
  return (
    <Card className="overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-zinc-800">
        {car.image ? (
          <Image
            src={car.image}
            alt={`${car.year} ${car.make} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <Settings className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No photo</p>
            </div>
          </div>
        )}
        {car.nickname && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
            <span className="text-sm font-medium text-white">{car.nickname}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={`/car/${car.id}`}>
          <h3 className="text-lg font-semibold text-white hover:text-orange-400 transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{car.year}</span>
          </div>
          {car.mileage && (
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4" />
              <span>{car.mileage.toLocaleString()} km</span>
            </div>
          )}
          {car.horsepower && (
            <div className="flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              <span>{car.horsepower} hp</span>
            </div>
          )}
        </div>

        {car.engine && (
          <p className="mt-2 text-sm text-zinc-500">{car.engine}</p>
        )}

        {isOwner && (
          <div className="mt-4 flex gap-2">
            <Link
              href={`/car/${car.id}/edit`}
              className="flex-1 text-center px-3 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <Link
              href={`/car/${car.id}/post`}
              className="flex-1 text-center px-3 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
            >
              New Post
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
