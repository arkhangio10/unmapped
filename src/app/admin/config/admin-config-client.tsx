'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCountry } from '@/lib/country-context'
import { CountryConfig } from '@/types'

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
  const [switching, setSwitching] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState(activeConfig)

  async function handleSwitch(code: string) {
    if (code === currentConfig.country_code) return
    setSwitching(code)
    try {
      await switchCountry(code)
      const newConfig = allConfigs.find(c => c.country_code === code)
      if (newConfig) setCurrentConfig(newConfig)
      router.refresh()
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Country Configuration</h1>
      <p className="text-slate-400 mb-8">
        Switch the active country. The entire app — language, currency, data sources, demo persona, calibration — updates instantly. No redeploy. No code change.
      </p>

      {/* Active country display */}
      <Card className="bg-gradient-to-br from-orange-950/30 to-slate-900 border-orange-500/30 mb-8">
        <CardContent className="pt-6 pb-6 flex items-center gap-4">
          <span className="text-5xl">{FLAG[currentConfig.country_code] ?? '🌍'}</span>
          <div>
            <Badge className="mb-1 bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
              Active country
            </Badge>
            <h2 className="text-2xl font-bold text-white">{currentConfig.country_name}</h2>
            <p className="text-slate-400 text-sm">
              Language: {currentConfig.primary_language.toUpperCase()} ·
              Currency: {currentConfig.currency} ·
              NEET rate: {Math.round(currentConfig.youth_neet_rate * 100)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Switch buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {allConfigs.map(config => (
          <Button
            key={config.country_code}
            size="lg"
            variant={currentConfig.country_code === config.country_code ? 'default' : 'outline'}
            className={
              currentConfig.country_code === config.country_code
                ? 'bg-orange-500 hover:bg-orange-500 text-white font-bold py-8 text-lg cursor-default'
                : 'border-slate-700 text-slate-300 hover:border-orange-400 hover:text-orange-400 font-bold py-8 text-lg'
            }
            onClick={() => handleSwitch(config.country_code)}
            disabled={switching !== null}
          >
            {switching === config.country_code ? (
              <span className="animate-pulse">Switching...</span>
            ) : (
              <>
                {FLAG[config.country_code]} Switch to {config.country_name}
              </>
            )}
          </Button>
        ))}
      </div>

      {/* YAML preview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-300 text-sm font-mono">
            config/countries/{currentConfig.country_code.toLowerCase()}.yaml
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-slate-400 font-mono leading-relaxed overflow-x-auto">
            {yamlPreview(currentConfig)}
          </pre>
        </CardContent>
      </Card>

      <p className="text-center text-slate-600 text-sm mt-6">
        This switch propagates to all pages. No redeploy. No code change.
        Any government can fork this repo and add a config file for their own country.
      </p>
    </div>
  )
}
