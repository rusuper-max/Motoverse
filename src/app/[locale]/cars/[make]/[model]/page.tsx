import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Car, Calendar, Users, Plus, Gauge, Fuel, Settings2, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { locales, Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'

interface Props {
  params: Promise<{ locale: string; make: string; model: string }>
}

async function getModelWithGenerations(makeSlug: string, modelSlug: string) {
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
        include: {
          engines: {
            orderBy: [{ horsepower: 'desc' }],
            take: 3, // Show top 3 engines per gen
          },
          _count: {
            select: { cars: true, engines: true },
          },
        },
      },
    },
  })

  if (!model) return null

  // Get cars linked via generation
  const genCarsCount = await prisma.car.count({
    where: {
      isPublic: true,
      generation: { modelId: model.id },
    },
  })

  // Get cars with direct make/model match (case-insensitive via raw query)
  const directCountResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Car"
    WHERE "isPublic" = true
    AND "generationId" IS NULL
    AND LOWER("make") = LOWER(${make.name})
    AND LOWER("model") = LOWER(${model.name})
  `
  const directCarsCount = Number(directCountResult[0]?.count || 0)
  const totalCars = genCarsCount + directCarsCount

  // Get recent cars for this model (generation-based)
  const genCars = await prisma.car.findMany({
    where: {
      isPublic: true,
      generation: { modelId: model.id },
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
    take: 6,
  })

  // Also get cars with direct make/model match
  const directCarIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Car"
    WHERE "isPublic" = true
    AND "generationId" IS NULL
    AND LOWER("make") = LOWER(${make.name})
    AND LOWER("model") = LOWER(${model.name})
    ORDER BY "createdAt" DESC
    LIMIT 6
  `

  // Fetch full data for direct cars if any
  let directCarsData: typeof genCars = []
  if (directCarIds.length > 0) {
    directCarsData = await prisma.car.findMany({
      where: {
        id: { in: directCarIds.map(c => c.id) },
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
    })
  }

  // Combine and dedupe cars
  const recentCars = [...genCars, ...directCarsData].slice(0, 6)

  return { ...model, totalCars, recentCars }
}

export async function generateMetadata({ params }: Props) {
  const { make: makeSlug, model: modelSlug } = await params
  const model = await getModelWithGenerations(makeSlug, modelSlug)

  if (!model) return { title: 'Not Found' }

  return {
    title: `${model.make.name} ${model.name} - MachineBio`,
    description: `${model.make.name} ${model.name} specifications, generations, engine options and community cars`,
  }
}

export default async function ModelPage({ params }: Props) {
  const { locale, make: makeSlug, model: modelSlug } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const data = await getModelWithGenerations(makeSlug, modelSlug)

  // Helper for locale-prefixed paths
  const localePath = (path: string) => `/${locale}${path}`

  if (!data) {
    notFound()
  }

  const { generations, totalCars, recentCars, ...model } = data

  // Calculate year range from generations
  const startYear = generations.length > 0
    ? generations[generations.length - 1].startYear
    : null
  const endYear = generations.length > 0
    ? generations[0].endYear
    : null

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
              <div className="flex items-center gap-4 mt-3 text-zinc-400">
                {startYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {startYear} - {endYear || 'present'}
                  </span>
                )}
                <span className="text-sm">
                  {generations.length} generation{generations.length !== 1 ? 's' : ''}
                </span>
              </div>
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
              <div className="text-2xl font-bold text-white">{totalCars}</div>
              <div className="text-sm text-zinc-500">{dict.cars.inGarages}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {generations.reduce((acc, g) => acc + g._count.engines, 0)}
              </div>
              <div className="text-sm text-zinc-500">{dict.cars.engineOptions || 'Engine options'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Generations Section */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">
            {dict.cars.generations || 'Generations'}
          </h2>

          {generations.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <Car className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No generation data available yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Add your {model.make.name} {model.name} to help build the database
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generations.map((gen) => (
                <Link
                  key={gen.id}
                  href={localePath(`/cars/${model.make.slug}/${model.slug}/${encodeURIComponent(gen.name)}`)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
                >
                  {/* Generation Header */}
                  <div className="p-5 border-b border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {gen.displayName || gen.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {gen.startYear} - {gen.endYear || 'present'}
                          </span>
                          {gen.bodyType && (
                            <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">
                              {dict.bodyTypes[gen.bodyType as keyof typeof dict.bodyTypes] || gen.bodyType}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                    </div>
                  </div>

                  {/* Engine Options Preview */}
                  <div className="p-5">
                    {gen.engines.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">
                          {gen._count.engines} engine{gen._count.engines !== 1 ? 's' : ''} available
                        </p>
                        {gen.engines.slice(0, 3).map((engine) => (
                          <div key={engine.id} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{engine.name}</span>
                            <div className="flex items-center gap-3 text-zinc-500">
                              {engine.horsepower && (
                                <span className="flex items-center gap-1">
                                  <Gauge className="w-3.5 h-3.5" />
                                  {engine.horsepower} HP
                                </span>
                              )}
                              {engine.fuelType && (
                                <span className="flex items-center gap-1">
                                  <Fuel className="w-3.5 h-3.5" />
                                  {engine.fuelType}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {gen._count.engines > 3 && (
                          <p className="text-xs text-orange-400">
                            +{gen._count.engines - 3} more engines
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No engine data yet</p>
                    )}

                    {/* Cars in garages */}
                    {gen._count.cars > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                          <Users className="w-4 h-4" />
                          {gen._count.cars} in community garages
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Community Cars Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {dict.cars.communityGarages}
            </h2>
            {totalCars > 6 && (
              <Link
                href={localePath(`/cars/${model.make.slug}/${model.slug}/owners`)}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                View all {totalCars} →
              </Link>
            )}
          </div>

          {recentCars.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {dict.cars.noCarsYet.replace('{model}', model.name)}
              </h3>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCars.map((car) => {
                const carMake = car.generation?.model?.make?.name || car.make || model.make.name
                const carModel = car.generation?.model?.name || car.model || model.name

                return (
                  <Link
                    key={car.id}
                    href={localePath(`/garage/${car.id}`)}
                    className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
                  >
                    {/* Car Image */}
                    <div className="aspect-video bg-zinc-800 relative">
                      {car.image ? (
                        <img
                          src={car.image}
                          alt={car.nickname || `${car.year} ${carMake} ${carModel}`}
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
                        {car.year} {carMake} {carModel}
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
                        {car.horsepower && <span>{car.horsepower} HP</span>}
                        {car.mileage && (
                          <span>{car.mileage.toLocaleString()} km</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
