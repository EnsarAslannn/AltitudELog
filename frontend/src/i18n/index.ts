import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tr } from './tr'
import { en } from './en'

export type Language = 'tr' | 'en'

export type TranslationKey = keyof typeof tr

export const LANGUAGE_STORAGE_KEY = 'altitudelog-language'

export const LANGUAGES: readonly Language[] = ['tr', 'en']

const dictionaries: Record<Language, Record<TranslationKey, string>> = { tr, en }

/**
 * BCP 47 tags for `Intl`/`toLocale*` formatting. Kept next to the dictionaries so a new
 * language cannot be added without deciding how its dates and numbers render.
 */
const localeTags: Record<Language, string> = { tr: 'tr-TR', en: 'en-GB' }

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      // Turkish is the default: an unset store — a first visit, a cleared browser — opens in `tr`.
      language: 'tr',
      setLanguage: (language) => set({ language }),
    }),
    { name: LANGUAGE_STORAGE_KEY },
  ),
)

export type TranslateParams = Record<string, string | number>

export type Translate = (key: TranslationKey, params?: TranslateParams) => string

export function translate(language: Language, key: TranslationKey, params?: TranslateParams): string {
  // Fall back to Turkish rather than rendering a raw key if a translation is ever missing.
  const value = dictionaries[language][key] ?? tr[key]
  if (!params) return value

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Translator bound to the active language. Re-renders every caller when the language changes. */
export function useT(): Translate {
  const language = useLanguageStore((state) => state.language)
  return useMemo(() => (key, params) => translate(language, key, params), [language])
}

/** The active language, for components that need the code itself (the toggle, date formatting). */
export function useLanguage(): Language {
  return useLanguageStore((state) => state.language)
}

/** BCP 47 tag for the active language, for `toLocaleString` and friends. */
export function useLocaleTag(): string {
  return localeTags[useLanguageStore((state) => state.language)]
}

function applyDocumentLanguage(language: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

applyDocumentLanguage(useLanguageStore.getState().language)
useLanguageStore.subscribe((state) => applyDocumentLanguage(state.language))

// Keep sibling tabs in step, the same way `authStore` mirrors its own key.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      useLanguageStore.persist.rehydrate()
    }
  })
}
