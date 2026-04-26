'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CountryConfig } from '@/types'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([config.primary_language])

  const [form, setForm] = useState({
    display_name: '',
    age: '',
    country_code: config.country_code,
    region: '',
    education_level: '',
    raw_self_description: '',
  })

  const demoDescription =
    config.primary_language === 'es'
      ? config.demo_persona.description_es
      : config.demo_persona.description_en

  async function fillDemo() {
    const demoForm = {
      display_name: config.demo_persona.name,
      age: String(config.demo_persona.age),
      country_code: config.country_code,
      region: config.demo_persona.region,
      education_level: 'secondary',
      raw_self_description: demoDescription,
    }
    setForm(demoForm)
    const demoLangs = config.secondary_languages.slice(0, 2)
    setSelectedLanguages(demoLangs)
    // Auto-submit for the wow demo flow
    await submitProfile(demoForm, demoLangs)
  }

  function toggleLanguage(lang: string) {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  async function submitProfile(formData: typeof form, langs: string[]) {
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
      if (!res.ok) throw new Error(data.error ?? 'Failed to create profile')

      // Stash summary in sessionStorage to avoid long URL query strings
      if (typeof window !== 'undefined' && data.human_readable_summary) {
        window.sessionStorage.setItem(`profile_summary_${data.user_id}`, data.human_readable_summary)
      }

      router.push(`/profile/${data.user_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitProfile(form, selectedLanguages)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Tell us about yourself</h1>
        <p className="text-slate-400">
          Write freely — the more you share, the better your profile. Use your own words.
        </p>
      </div>

      <div className="mb-6">
        <Button
          type="button"
          variant="outline"
          className="border-orange-500/40 text-orange-400 hover:border-orange-400 hover:bg-orange-500/10"
          onClick={fillDemo}
        >
          ✨ Use demo persona ({config.demo_persona.name}, {config.demo_persona.region})
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="display_name" className="text-sm font-medium text-slate-300">
              Your name
            </label>
            <Input
              id="display_name"
              placeholder="Diego"
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="age" className="text-sm font-medium text-slate-300">
              Age
            </label>
            <Input
              id="age"
              type="number"
              placeholder="21"
              min={14}
              max={65}
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Country</label>
            <Select
              value={form.country_code}
              onValueChange={v => setForm(f => ({ ...f, country_code: v as 'PER' | 'GHA' }))}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="PER">🇵🇪 Peru</SelectItem>
                <SelectItem value="GHA">🇬🇭 Ghana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="region" className="text-sm font-medium text-slate-300">
              Region or city
            </label>
            <Input
              id="region"
              placeholder="Cusco"
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Highest education level</label>
          <Select
            value={form.education_level}
            onValueChange={v => setForm(f => ({ ...f, education_level: v ?? '' }))}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="none">No formal education</SelectItem>
              <SelectItem value="primary">Primary school</SelectItem>
              <SelectItem value="secondary">Secondary school</SelectItem>
              <SelectItem value="vocational">Vocational training</SelectItem>
              <SelectItem value="tertiary">University or college</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Languages you speak</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(lang => (
              <button
                key={lang.value}
                type="button"
                onClick={() => toggleLanguage(lang.value)}
                className="focus:outline-none"
              >
                <Badge
                  variant={selectedLanguages.includes(lang.value) ? 'default' : 'secondary'}
                  className={
                    selectedLanguages.includes(lang.value)
                      ? 'bg-orange-500 text-white cursor-pointer hover:bg-orange-400'
                      : 'bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700'
                  }
                >
                  {lang.label}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-300">
            Describe your work, skills, and experience
          </label>
          <Textarea
            id="description"
            placeholder={demoDescription}
            value={form.raw_self_description}
            onChange={e => setForm(f => ({ ...f, raw_self_description: e.target.value }))}
            required
            rows={6}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 resize-none"
          />
          <p className="text-xs text-slate-500">
            {form.raw_self_description.length} / 3000 characters. Write in any language.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-6 text-lg rounded-xl"
        >
          {loading ? 'Generating your profile...' : 'Generate my profile →'}
        </Button>
      </form>
    </div>
  )
}
