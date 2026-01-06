import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Car, Calendar, Users, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { locales, Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'

interface Props {
  params: Promise<{ locale: string; make: string; model: string }>
}

async function getModelWithCars(makeSlug: string, modelSlug: string) {
  const make = await prisma.carMake.findUnique({
    where: { slug: makeSlug },
    select: { id: true, name: true, slug: true },
  })

  if (!make) return null

  const model = await prisma.carModel.findUnique({
    where: {
      makeId_slug: {
        makeId: make.id,
        slug: modelSlug,
      },
    },
    include: {
      make: true,
      generations: {
        orderBy: { startYear: 'desc' },
      },
    },
  })

  if (!model) return null

  // Get cars for all generations of this model
  const cars = await prisma.car.findMany({
    where: {
      isPublic: true,
      generation: {
        modelId: model.id,
      },
    },
    include: {
      generation: true,
      owner: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return { ...model, cars }
}

export async function generateMetadata({ params }: Props) {
  const { make: makeSlug, model: modelSlug } = await params
  const model = await getModelWithCars(makeSlug, modelSlug)

  if (!model) return { title: 'Not Found' }

  return {
    title: `${model.make.name} ${model.name} - Motoverse`,
    description: `See ${model.make.name} ${model.name} cars from the community, read build logs and maintenance tips`,
  }
}

export default async function ModelPage({ params }: Props) {
  const { locale, make: makeSlug, model: modelSlug } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const model = await getModelWithCars(makeSlug, modelSlug)

  // Helper for locale-prefixed paths
  const localePath = (path: string) => `/${locale}${path}`

  if (!model) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
            <Link href={localePath('/cars')} className="hover:text-white transition-colors">
              {dict.cars.allMakes}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <Link
              href={localePath(`/cars/${model.make.slug}`)}
              className="hover:text-white transition-colors"
            >
              {model.make.name}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span className="text-white">{model.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {model.make.name} {model.name}
              </h1>
              {model.generations.length > 0 && (
                <div className="flex items-center gap-4 mt-3 text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {model.generations[model.generations.length - 1].startYear} - {model.generations[0].endYear || 'present'}
                  </span>
                  <span className="text-sm">
                    {model.generations.length} generation{model.generations.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <Link href={localePath('/garage/add')}>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                {dict.cars.addToGarage}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-8">
            <div>
              <div className="text-2xl font-bold text-white">{model.cars.length}</div>
              <div className="text-sm text-zinc-500">{dict.cars.inGarages}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {model.cars.reduce((acc: number, car) => acc + car._count.posts, 0)}
              </div>
              <div className="text-sm text-zinc-500">{dict.cars.posts}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {model.cars.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {dict.cars.noCarsYet.replace('{model}', model.name)}
            </h2>
            <p className="text-zinc-400 mb-6">
              {dict.cars.beFirstToAddModel.replace('{make}', model.make.name).replace('{model}', model.name)}
            </p>
            <Link href={localePath('/garage/add')}>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                {dict.cars.addYourCar}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-6">
              {dict.cars.communityGarages}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {model.cars.map((car) => (
                <Link
                  key={car.id}
                  href={localePath(`/car/${car.id}`)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
                >
                  {/* Car Image */}
                  <div className="aspect-video bg-zinc-800 relative">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.nickname || `${car.year} ${model.make.name} ${model.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-zinc-700" />
                      </div>
                    )}
                    {car.nickname && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-sm text-white">
                        {car.nickname}
                      </div>
                    )}
                  </div>

                  {/* Car Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                      {car.year} {model.make.name} {model.name}
                    </h3>
                    {car.generation && (
                      <p className="text-sm text-orange-400/70 mt-0.5">
                        {car.generation.displayName || car.generation.name}
                      </p>
                    )}

                    {/* Owner */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {(car.owner.name || car.owner.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-400">
                        {car.owner.name || car.owner.username}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                      {car.engine && <span>{car.engine}</span>}
                      {car.mileage && (
                        <span>{car.mileage.toLocaleString()} km</span>
                      )}
                      {car._count.posts > 0 && (
                        <span>{car._count.posts} {dict.cars.posts}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
