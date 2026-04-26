'use client'

import en from '../../messages/en.json'
import es from '../../messages/es.json'
import { useCountry } from './country-context'

type Messages = typeof en

const LOCALES: Record<string, Messages> = { en, es }

function getNested(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

/**
 * Returns a translation function bound to the active country's primary_language.
 * Country switch automatically re-renders consumers via React context.
 */
export function useT() {
  const { country } = useCountry()
  const lang = country?.primary_language ?? 'en'
  const messages = LOCALES[lang] ?? LOCALES.en

  return (key: string): string => getNested(messages, key) as string
}

export function useLang(): string {
  const { country } = useCountry()
  return country?.primary_language ?? 'en'
}
