export const locales = ['en', 'sr', 'de', 'ru'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  sr: 'Srpski',
  de: 'Deutsch',
  ru: 'Русский',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  sr: '🇷🇸',
  de: '🇩🇪',
  ru: '🇷🇺',
}
