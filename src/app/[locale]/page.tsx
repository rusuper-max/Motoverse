import Link from 'next/link'
import { Car, ArrowRight, Camera, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import EngineBayHero from '@/components/landing/EngineBayHero'
import InteractiveLanding from '@/components/landing/InteractiveLanding'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  const dict = getDictionary(locale as Locale)
  const t = dict.landing

  // Features for the interactive gear shifter (without icon - can't pass functions to client components)
  const features = [
    {
      id: 'garage',
      title: t.features.garage.title,
      description: t.features.garage.description,
    },
    {
      id: 'builds',
      title: t.features.builds.title,
      description: t.features.builds.description,
    },
    {
      id: 'community',
      title: t.features.community.title,
      description: t.features.community.description,
    },
    {
      id: 'marketplace',
      title: t.features.marketplace.title,
      description: t.features.marketplace.description,
    },
    {
      id: 'events',
      title: t.features.events.title,
      description: t.features.events.description,
    },
  ]

  const localePath = (path: string) => `/${locale}${path}`

  return (
    <div className="min-h-screen">
      <InteractiveLanding
        features={features}
        dict={{ gearShifter: t.gearShifter }}
      >
        {/* Hero Section with Engine Bay Animation */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-zinc-950 to-zinc-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
            {/* Engine Bay Animation - positioned behind content */}
            <div className="absolute inset-0 overflow-hidden">
              <EngineBayHero />
            </div>

            {/* Hero Content */}
            <div className="relative text-center max-w-4xl mx-auto py-16 md:py-24">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="text-white drop-shadow-lg">{t.hero.title1}</span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                  {t.hero.title2}
                </span>
                <br />
                <span className="text-white drop-shadow-lg">{t.hero.title3}</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto">
                {t.hero.subtitle}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={localePath('/register')}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {t.hero.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href={localePath('/explore')}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {t.hero.exploreCta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </InteractiveLanding>

      {/* How it Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t.howItWorks.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.howItWorks.step1.title}</h3>
              <p className="text-zinc-400">
                {t.howItWorks.step1.description}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.howItWorks.step2.title}</h3>
              <p className="text-zinc-400">
                {t.howItWorks.step2.description}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.howItWorks.step3.title}</h3>
              <p className="text-zinc-400">
                {t.howItWorks.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-orange-600/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.cta.title}
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            {t.cta.subtitle}
          </p>
          <Link href={localePath('/register')}>
            <Button size="lg">
              {t.cta.button}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">MachineBio</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href={localePath('/about')} className="hover:text-white transition-colors">{dict.footer.about}</Link>
              <Link href={localePath('/terms')} className="hover:text-white transition-colors">{dict.footer.terms}</Link>
              <Link href={localePath('/privacy')} className="hover:text-white transition-colors">{dict.footer.privacy}</Link>
              <Link href={localePath('/contact')} className="hover:text-white transition-colors">{dict.footer.contact}</Link>
            </div>
            <p className="text-sm text-zinc-600">
              {dict.footer.copyright.replace('{year}', '2025')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
