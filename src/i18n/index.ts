import { Locale, defaultLocale } from './config'
import en from './locales/en'
import sr from './locales/sr'
import de from './locales/de'
import ru from './locales/ru'

// Use a type that allows string values instead of literal types
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string
}

export type Dictionary = DeepStringify<typeof en>

const dictionaries: Record<Locale, Dictionary> = {
  en,
  sr,
  de,
  ru,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries[defaultLocale]
}

// Type-safe translation getter with nested key support
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K
      : never
    }[keyof T]
  : never

export type TranslationKey = NestedKeyOf<Dictionary>

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path // Return key if not found
    }
  }

  return typeof result === 'string' ? result : path
}

// Helper to replace placeholders like {year}, {make}, etc.
export function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`))
}
