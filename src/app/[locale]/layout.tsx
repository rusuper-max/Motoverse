import { notFound } from 'next/navigation'
import { locales, Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'
import Navbar from '@/components/layout/Navbar'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)

  return (
    <>
      <Navbar locale={locale as Locale} dict={dict} />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </>
  )
}
