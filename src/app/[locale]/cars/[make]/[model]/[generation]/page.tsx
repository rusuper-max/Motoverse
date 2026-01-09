import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Car, Calendar, Users, Plus, Gauge, Fuel, Settings2, Cog, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { locales, Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'

interface Props {
  params: Promise<{ locale: string; make: string; model: string; generation: string }>
}

async function getGenerationWithEngines(makeSlug: string, modelSlug: string, generationName: string) {
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
    include: { make: true },
  })

  if (!model) return null

  // Decode generation name (it might be URL encoded)
  const decodedGenName = decodeURIComponent(generationName)

  const generation = await prisma.carGeneration.findFirst({
    where: {
      modelId: model.id,
      name: decodedGenName,
    },
    include: {
      model: {
        include: { make: true },
      },
      engines: {
        orderBy: [
          { fuelType: 'asc' },
          { horsepower: 'desc' },
        ],
      },
      _count: {
        select: { cars: true },
      },
    },
  })

  if (!generation) return null

  // Get cars for this generation
  const cars = await prisma.car.findMany({
    where: {
      isPublic: true,
      generationId: generation.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      engineConfig: true,
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return { generation, model, make, cars }
}

export async function generateMetadata({ params }: Props) {
  const { make: makeSlug, model: modelSlug, generation: genName } = await params
  const data = await getGenerationWithEngines(makeSlug, modelSlug, genName)

  if (!data) return { title: 'Not Found' }

  const { generation, make, model } = data
  return {
    title: `${make.name} ${model.name} ${generation.displayName || generation.name} - MachineBio`,
    description: `${make.name} ${model.name} ${generation.displayName || generation.name} (${generation.startYear}-${generation.endYear || 'present'}) specifications, engine options, and community cars`,
  }
}

export default async function GenerationPage({ params }: Props) {
  const { locale, make: makeSlug, model: modelSlug, generation: genName } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const data = await getGenerationWithEngines(makeSlug, modelSlug, genName)

  // Helper for locale-prefixed paths
  const localePath = (path: string) => `/${locale}${path}`

  if (!data) {
    notFound()
  }

  const { generation, model, make, cars } = data

  // Group engines by fuel type
  const enginesByFuelType = generation.engines.reduce((acc, engine) => {
    const type = engine.fuelType || 'Other'
    if (!acc[type]) acc[type] = []
    acc[type].push(engine)
    return acc
  }, {} as Record<string, typeof generation.engines>)

  const fuelTypes = Object.keys(enginesByFuelType).sort()

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6 flex-wrap">
            <Link href={localePath('/cars')} className="hover:text-white transition-colors">
              {dict.cars.allMakes}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <Link
              href={localePath(`/cars/${make.slug}`)}
              className="hover:text-white transition-colors"
            >
              {make.name}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <Link
              href={localePath(`/cars/${make.slug}/${model.slug}`)}
              className="hover:text-white transition-colors"
            >
              {model.name}
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span className="text-white">{generation.displayName || generation.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {make.name} {model.name}
              </h1>
              <p className="text-xl text-orange-400 mt-1">
                {generation.displayName || generation.name}
              </p>
              <div className="flex items-center gap-4 mt-3 text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {generation.startYear} - {generation.endYear || 'present'}
                </span>
                {generation.bodyType && (
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-sm">
                    {dict.bodyTypes[generation.bodyType as keyof typeof dict.bodyTypes] || generation.bodyType}
                  </span>
                )}
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
              <div className="text-2xl font-bold text-white">{generation._count.cars}</div>
              <div className="text-sm text-zinc-500">{dict.cars.inGarages}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{generation.engines.length}</div>
              <div className="text-sm text-zinc-500">{dict.cars.engineOptions || 'Engine options'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Engine Options Section */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">
            {dict.cars.engineOptions || 'Engine Options'}
          </h2>

          {generation.engines.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <Cog className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No engine data available yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Engine specifications will be added soon
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {fuelTypes.map((fuelType) => (
                <div key={fuelType}>
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Fuel className="w-4 h-4" />
                    {fuelType}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enginesByFuelType[fuelType].map((engine) => (
                      <div
                        key={engine.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col h-full"
                      >
                        <h4 className="font-semibold text-white text-lg mb-3">
                          {engine.name}
                        </h4>

                        <div className="space-y-2">
                          {/* Power & Torque */}
                          <div className="grid grid-cols-2 gap-4">
                            {engine.horsepower && (
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                                  <Gauge className="w-3.5 h-3.5" />
                                  Power
                                </div>
                                <p className="text-xl font-bold text-white">
                                  {engine.horsepower} <span className="text-sm font-normal text-zinc-400">HP</span>
                                </p>
                              </div>
                            )}
                            {engine.torque && (
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                                  <Zap className="w-3.5 h-3.5" />
                                  Torque
                                </div>
                                <p className="text-xl font-bold text-white">
                                  {engine.torque} <span className="text-sm font-normal text-zinc-400">Nm</span>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Other specs */}
                          <div className="pt-3 border-t border-zinc-800 space-y-2">
                            {engine.displacement && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Displacement</span>
                                <span className="text-zinc-300">{engine.displacement}</span>
                              </div>
                            )}
                            {engine.transmission && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Transmission</span>
                                <span className="text-zinc-300">{engine.transmission}</span>
                              </div>
                            )}
                            {engine.drivetrain && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Drivetrain</span>
                                <span className="text-zinc-300">{engine.drivetrain}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Link
                          href={localePath(`/garage/add?make=${encodeURIComponent(make.name)}&model=${encodeURIComponent(model.name)}&generation=${encodeURIComponent(generation.name)}&engine=${encodeURIComponent(engine.name)}`)}
                          className="mt-auto pt-4"
                        >
                          <Button size="sm" variant="secondary" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            {dict.cars.addToGarage}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
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
            {generation._count.cars > 12 && (
              <span className="text-sm text-zinc-400">
                Showing {Math.min(12, cars.length)} of {generation._count.cars}
              </span>
            )}
          </div>

          {cars.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No {generation.displayName || generation.name} in garages yet
              </h3>
              <p className="text-zinc-400 mb-6">
                Be the first to add your {make.name} {model.name} {generation.displayName || generation.name}
              </p>
              <Link href={localePath('/garage/add')}>
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  {dict.cars.addYourCar}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car) => (
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
                        alt={car.nickname || `${car.year} ${make.name} ${model.name}`}
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
                      {car.year} {make.name} {model.name}
                    </h3>
                    {car.engineConfig && (
                      <p className="text-sm text-orange-400/70 mt-0.5">
                        {car.engineConfig.name}
                      </p>
                    )}

                    {/* Owner */}
                    <div className="flex items-center gap-2 mt-3">
                      {car.owner.avatar ? (
                        <img
                          src={car.owner.avatar}
                          alt={car.owner.name || car.owner.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {(car.owner.name || car.owner.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-zinc-400">
                        {car.owner.name || car.owner.username}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3 text-sm text-zinc-500">
                      {car.horsepower && (
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5" />
                          {car.horsepower} HP
                        </span>
                      )}
                      {car.mileage && (
                        <span>{car.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
