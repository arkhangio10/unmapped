'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Reveal } from '@/components/reveal'
import { VoiceTextarea } from '@/components/voice-textarea'
import { LoadingBulldog } from '@/components/loading-bulldog'
import { CountryConfig } from '@/types'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { useCountry } from '@/lib/country-context'

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'qu', label: 'Quechua' },
  { value: 'tw', label: 'Twi' },
  { value: 'ee', label: 'Ewe' },
  { value: 'fr', label: 'Français' },
]

export default function OnboardingForm({ config }: { config: CountryConfig }) {
  const router = useRouter()
  const t = useT()
  const { country, switchCountry } = useCountry()
  // Use the live country config from context (not the SSR snapshot)
  const liveConfig = country ?? config

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([liveConfig.primary_language])

  const [form, setForm] = useState({
    display_name: '',
    age: '',
    country_code: liveConfig.country_code,
    region: '',
    education_level: '',
    raw_self_description: '',
  })

  const demoDescription =
    liveConfig.primary_language === 'es' ? liveConfig.demo_persona.description_es : liveConfig.demo_persona.description_en

  // Build the region list based on the currently selected country in the form,
  // not just the live country — so user can switch country and see new regions.
  const allConfigs = useMemo(() => {
    const map: Record<string, string[]> = {
      PER: liveConfig.country_code === 'PER' ? liveConfig.regions ?? [] : [],
      GHA: liveConfig.country_code === 'GHA' ? liveConfig.regions ?? [] : [],
    }
    map[liveConfig.country_code] = liveConfig.regions ?? []
    return map
  }, [liveConfig])

  const [regionsByCountry, setRegionsByCountry] = useState<Record<string, string[]>>(allConfigs)

  // Lazy-load other country's regions if user switches the country dropdown
  useEffect(() => {
    if (regionsByCountry[form.country_code]?.length) return
    fetch(`/api/v1/config/${form.country_code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.regions) {
          setRegionsByCountry((prev) => ({ ...prev, [form.country_code]: d.config.regions }))
        }
      })
      .catch(() => {})
  }, [form.country_code, regionsByCountry])

  const currentRegions = regionsByCountry[form.country_code] ?? []

  async function fillDemo() {
    const demoForm = {
      display_name: liveConfig.demo_persona.name,
      age: String(liveConfig.demo_persona.age),
      country_code: liveConfig.country_code,
      region: liveConfig.demo_persona.region,
      education_level: 'secondary',
      raw_self_description: demoDescription,
    }
    setForm(demoForm)
    const demoLangs = liveConfig.secondary_languages.slice(0, 2)
    setSelectedLanguages(demoLangs)
    await submitProfile(demoForm, demoLangs)
  }

  function toggleLanguage(lang: string) {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  function validate(formData: typeof form): string | null {
    if (!formData.display_name.trim()) return t('onboarding.error_no_name')
    if (!formData.region) return t('onboarding.error_no_region')
    if (formData.raw_self_description.trim().length < 20) return t('onboarding.error_too_short')
    return null
  }

  async function submitProfile(formData: typeof form, langs: string[]) {
    const validationError = validate(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? Number(formData.age) : undefined,
          languages: langs,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Map known API errors to friendly messages
        const apiMsg = data?.details?.[0]?.message ?? data?.error ?? ''
        if (apiMsg.includes('20 characters') || apiMsg.includes('too_small')) {
          throw new Error(t('onboarding.error_too_short'))
        }
        throw new Error(apiMsg || t('onboarding.error_generic'))
      }

      if (typeof window !== 'undefined') {
        if (data.human_readable_summary) {
          window.sessionStorage.setItem(`profile_summary_${data.user_id}`, data.human_readable_summary)
        }
        if (typeof data.candidate_count === 'number') {
          window.sessionStorage.setItem(
            `profile_extraction_${data.user_id}`,
            JSON.stringify({ candidates: data.candidate_count, mapped: data.mapped_count })
          )
        }
      }
      router.push(`/profile/${data.user_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitProfile(form, selectedLanguages)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      {loading && <LoadingBulldog />}
      <Reveal>
        <h1 className="font-serif-display text-4xl sm:text-5xl text-foreground mb-2">{t('onboarding.title')}</h1>
        <p className="text-muted-foreground leading-relaxed">{t('onboarding.subtitle')}</p>
      </Reveal>

      <Reveal delay={150}>
        <button
          type="button"
          onClick={fillDemo}
          disabled={loading}
          className="hover-lift mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:border-primary disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {t('onboarding.use_demo')} ({liveConfig.demo_persona.name}, {liveConfig.demo_persona.region})
        </button>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Reveal delay={250}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="display_name" className="text-sm font-medium text-foreground">
                {t('onboarding.name_label')}
              </label>
              <Input
                id="display_name"
                placeholder="Diego"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="age" className="text-sm font-medium text-foreground">
                {t('onboarding.age_label')}
              </label>
              <Input
                id="age"
                type="number"
                placeholder="21"
                min={14}
                max={65}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('onboarding.country_label')}</label>
              <Select
                value={form.country_code}
                onValueChange={(v) => {
                  const code = v as 'PER' | 'GHA'
                  setForm((f) => ({ ...f, country_code: code, region: '' }))
                  // Sync global active country so the entire UI flips language
                  if (code !== liveConfig.country_code) {
                    switchCountry(code)
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER">🇵🇪 Peru</SelectItem>
                  <SelectItem value="GHA">🇬🇭 Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('onboarding.region_label')}
              </label>
              <Select
                value={form.region}
                onValueChange={(v) => setForm((f) => ({ ...f, region: v ?? '' }))}
              >
                <SelectTrigger className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t('onboarding.region_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {currentRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Reveal>

        <Reveal delay={350}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('onboarding.education_label')}</label>
            <Select
              value={form.education_level}
              onValueChange={(v) => setForm((f) => ({ ...f, education_level: v ?? '' }))}
            >
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('onboarding.education_none')}</SelectItem>
                <SelectItem value="primary">{t('onboarding.education_primary')}</SelectItem>
                <SelectItem value="secondary">{t('onboarding.education_secondary')}</SelectItem>
                <SelectItem value="vocational">{t('onboarding.education_vocational')}</SelectItem>
                <SelectItem value="tertiary">{t('onboarding.education_tertiary')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('onboarding.languages_label')}</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = selectedLanguages.includes(lang.value)
                return (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleLanguage(lang.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {lang.label}
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={450}>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              {t('onboarding.description_label')}
            </label>
            <VoiceTextarea
              value={form.raw_self_description}
              onChange={(v) => setForm((f) => ({ ...f, raw_self_description: v }))}
              placeholder={demoDescription}
              maxLength={3000}
              lang={liveConfig.primary_language}
              hint={t('onboarding.voice_hint')}
              listeningLabel={t('onboarding.voice_listening')}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  'tabular-nums',
                  form.raw_self_description.trim().length >= 20
                    ? 'text-primary font-medium'
                    : 'text-coral'
                )}
              >
                {form.raw_self_description.length} / 3000 ·{' '}
                {form.raw_self_description.trim().length >= 20
                  ? '✓'
                  : `${20 - form.raw_self_description.trim().length} ${t('onboarding.min_chars_hint')}`}
              </span>
              <span className="text-muted-foreground">{t('onboarding.description_helper')}</span>
            </div>
          </div>
        </Reveal>

        {error && (
          <div className="rounded-xl border border-coral/40 bg-coral/10 p-3 text-sm text-coral flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Reveal delay={500}>
          <Button
            type="submit"
            disabled={loading}
            className="hover-lift w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              t('onboarding.generating')
            ) : (
              <span className="inline-flex items-center gap-2">
                {t('onboarding.submit')} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </Reveal>
      </form>
    </div>
  )
}
