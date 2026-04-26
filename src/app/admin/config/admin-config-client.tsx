'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useCountry } from '@/lib/country-context'
import { useT } from '@/lib/i18n'
import { CountryConfig } from '@/types'
import { cn } from '@/lib/utils'

const FLAG: Record<string, string> = { PER: '🇵🇪', GHA: '🇬🇭' }

function yamlPreview(config: CountryConfig): string {
  return `country_code: ${config.country_code}
country_name: ${config.country_name}
primary_language: ${config.primary_language}
currency: ${config.currency}
isco_version: ${config.isco_version}
automation_calibration:
  manual_routine: ${config.automation_calibration.manual_routine}
  cognitive_routine: ${config.automation_calibration.cognitive_routine}
  manual_nonroutine: ${config.automation_calibration.manual_nonroutine}
informal_economy_share: ${config.informal_economy_share}
youth_neet_rate: ${config.youth_neet_rate}
demo_persona:
  name: ${config.demo_persona.name}
  age: ${config.demo_persona.age}
  region: ${config.demo_persona.region}`
}

export default function AdminConfigClient({
  activeConfig,
  allConfigs,
}: {
  activeConfig: CountryConfig
  allConfigs: CountryConfig[]
}) {
  const router = useRouter()
  const { switchCountry } = useCountry()
  const t = useT()
  const [switching, setSwitching] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState(activeConfig)

  async function handleSwitch(code: string) {
    if (code === currentConfig.country_code) return
    setSwitching(code)
    try {
      await switchCountry(code)
      const newConfig = allConfigs.find((c) => c.country_code === code)
      if (newConfig) setCurrentConfig(newConfig)
      router.refresh()
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Reveal>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
          <Globe className="h-3.5 w-3.5" /> {t('admin.label')}
        </div>
        <h1 className="font-serif-display text-4xl sm:text-5xl text-foreground mb-3">
          {t('admin.title')}
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">{t('admin.subtitle')}</p>
      </Reveal>

      {/* Active country */}
      <Reveal delay={150}>
        <div className="card-elevated p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-5">
            <span className="text-5xl">{FLAG[currentConfig.country_code] ?? '🌍'}</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">{t('admin.active_country')}</p>
              <h2 className="font-serif-display text-3xl text-foreground">{currentConfig.country_name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Language: {currentConfig.primary_language.toUpperCase()} · Currency: {currentConfig.currency} ·
                NEET rate: {Math.round(currentConfig.youth_neet_rate * 100)}%
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Switch buttons */}
      <Reveal delay={250}>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {allConfigs.map((config) => {
            const isActive = currentConfig.country_code === config.country_code
            return (
              <button
                key={config.country_code}
                onClick={() => handleSwitch(config.country_code)}
                disabled={switching !== null}
                className={cn(
                  'hover-lift rounded-2xl border-2 p-6 text-left transition-all',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                )}
              >
                <div className="text-3xl mb-2">{FLAG[config.country_code]}</div>
                <p className="font-semibold text-base">
                  {switching === config.country_code ? (
                    <span className="animate-pulse">{t('admin.switching')}</span>
                  ) : isActive ? (
                    `${t('admin.active_prefix')} · ${config.country_name}`
                  ) : (
                    `${t('admin.switch_to')} ${config.country_name}`
                  )}
                </p>
                <p className={cn('text-xs mt-1', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  {config.demo_persona.name}, {config.demo_persona.age} · {config.demo_persona.region}
                </p>
              </button>
            )
          })}
        </div>
      </Reveal>

      {/* YAML preview */}
      <Reveal delay={350}>
        <div className="card-elevated">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs font-data text-muted-foreground">
              config/countries/{currentConfig.country_code.toLowerCase()}.yaml
            </p>
          </div>
          <pre className="px-5 py-4 text-xs text-foreground/80 font-data leading-relaxed overflow-x-auto">
            {yamlPreview(currentConfig)}
          </pre>
        </div>
      </Reveal>

      <Reveal delay={450}>
        <p className="text-center text-muted-foreground text-sm mt-8">{t('admin.footer')}</p>
      </Reveal>
    </div>
  )
}
