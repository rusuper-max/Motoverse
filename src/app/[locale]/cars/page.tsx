import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Search } from 'lucide-react'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
}

export const metadata = {
  title: 'Car Catalog - MachineBio',
  description: 'Browse all car makes and models',
}

async function getCarMakes() {
  const makes = await prisma.carMake.findMany({
    orderBy: [
      { isPopular: 'desc' },
      { name: 'asc' },
    ],
    include: {
      _count: {
        select: { models: true },
      },
    },
  })
  return makes
}

export default async function CarsPage({ params }: Props) {
  const { locale } = await params
  const dict = getDictionary(locale as Locale)
  const t = dict.cars

  const makes = await getCarMakes()

  // Group by first letter
  const popularMakes = makes.filter((m) => m.isPopular)
  const allMakes = makes.filter((m) => !m.isPopular)

  const groupedMakes = allMakes.reduce((acc, make) => {
    const letter = make.name.charAt(0).toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(make)
    return acc
  }, {} as Record<string, typeof allMakes>)

  const alphabet = Object.keys(groupedMakes).sort()
  const localePath = (path: string) => `/${locale}${path}`

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.title}
          </h1>
          <p className="text-zinc-400 text-lg mb-8">
            {t.subtitle}
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Popular Makes */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">{t.popularMakes}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularMakes.map((make) => (
              <Link
                key={make.id}
                href={localePath(`/cars/${make.slug}`)}
                className="group p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-orange-500/10 transition-colors">
                    <span className="text-2xl font-bold text-zinc-400 group-hover:text-orange-500 transition-colors">
                      {make.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                    {make.name}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {make._count.models} {t.models}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Makes by Letter */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">{t.allMakes}</h2>

          {/* Alphabet quick nav */}
          <div className="flex flex-wrap gap-2 mb-8">
            {alphabet.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 text-zinc-400 hover:bg-orange-500 hover:text-white transition-colors text-sm font-medium"
              >
                {letter}
              </a>
            ))}
          </div>

          {/* Makes by letter */}
          <div className="space-y-8">
            {alphabet.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h3 className="text-lg font-semibold text-orange-500 mb-4 sticky top-20 bg-zinc-950 py-2">
                  {letter}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {groupedMakes[letter].map((make) => (
                    <Link
                      key={make.id}
                      href={localePath(`/cars/${make.slug}`)}
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all"
                    >
                      <span className="text-white hover:text-orange-400 transition-colors">
                        {make.name}
                      </span>
                      {make._count.models > 0 && (
                        <span className="text-zinc-500 text-sm ml-2">
                          ({make._count.models})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
