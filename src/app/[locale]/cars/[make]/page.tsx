import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Car, Calendar } from 'lucide-react'
import { locales, Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'

interface Props {
  params: Promise<{ locale: string; make: string }>
}

async function getMakeWithModels(slug: string) {
  const make = await prisma.carMake.findUnique({
    where: { slug },
    include: {
      models: {
        orderBy: { name: 'asc' },
        include: {
          generations: {
            orderBy: { startYear: 'asc' },
            select: {
              id: true,
              startYear: true,
              endYear: true,
              bodyType: true,
              _count: {
                select: { cars: true },
              },
            },
          },
        },
      },
    },
  })
  return make
}

export async function generateMetadata({ params }: Props) {
  const { make: slug } = await params
  const make = await prisma.carMake.findUnique({
    where: { slug },
    select: { name: true },
  })

  if (!make) return { title: 'Not Found' }

  return {
    title: `${make.name} Models - MachineBio`,
    description: `Browse all ${make.name} models and see cars from the community`,
  }
}

export default async function MakePage({ params }: Props) {
  const { locale, make: slug } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const make = await getMakeWithModels(slug)

  // Helper for locale-prefixed paths
  const localePath = (path: string) => `/${locale}${path}`

  if (!make) {
    notFound()
  }

  // Helper to get model info from generations
  const getModelInfo = (model: typeof make.models[0]) => {
    const gens = model.generations
    if (gens.length === 0) return { startYear: null, endYear: null, bodyType: 'other', carCount: 0 }

    const startYear = gens[0].startYear
    const endYear = gens[gens.length - 1].endYear
    const bodyType = gens[0].bodyType || 'other'
    const carCount = gens.reduce((sum, g) => sum + g._count.cars, 0)
    return { startYear, endYear, bodyType, carCount }
  }

  // Group models by primary body type (from first generation)
  const modelsByType = make.models.reduce((acc, model) => {
    const { bodyType } = getModelInfo(model)
    if (!acc[bodyType]) acc[bodyType] = []
    acc[bodyType].push(model)
    return acc
  }, {} as Record<string, typeof make.models>)

  const bodyTypes = Object.keys(modelsByType).sort()

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <Link
            href={localePath('/cars')}
            className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {dict.cars.allMakes}
          </Link>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl font-bold text-orange-500">
                {make.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {make.name}
              </h1>
              {make.country && (
                <p className="text-zinc-400 mt-1">{make.country}</p>
              )}
              <p className="text-zinc-500 text-sm mt-2">
                {make.models.length} {dict.cars.models}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {make.models.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {dict.cars.noModelsYet}
            </h2>
            <p className="text-zinc-400">
              {dict.cars.beFirstToAdd.replace('{make}', make.name)}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {bodyTypes.map((type) => (
              <section key={type}>
                <h2 className="text-lg font-semibold text-white mb-4">
                  {dict.bodyTypes[type as keyof typeof dict.bodyTypes] || dict.bodyTypes.other}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {modelsByType[type].map((model) => {
                    const info = getModelInfo(model)
                    return (
                      <Link
                        key={model.id}
                        href={localePath(`/cars/${make.slug}/${model.slug}`)}
                        className="group p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all"
                      >
                        <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                          {model.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                          {info.startYear && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {info.startYear}
                              {info.endYear ? ` - ${info.endYear}` : '+'}
                            </span>
                          )}
                          {model.generations.length > 0 && (
                            <span className="text-orange-400/70">
                              {model.generations.length} gen{model.generations.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {info.carCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Car className="w-4 h-4" />
                              {info.carCount}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
