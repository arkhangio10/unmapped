'use client'

import { useEffect, useState } from 'react'
import { Reveal } from '@/components/reveal'
import { useT, useLang } from '@/lib/i18n'

const FLAG: Record<string, string> = { PER: '🇵🇪 Peru', GHA: '🇬🇭 Ghana' }

export default function SummaryCard({
  userId,
  displayName,
  region,
  countryCode,
}: {
  userId: string
  displayName: string
  region: string | null
  countryCode: string
}) {
  const t = useT()
  const lang = useLang()
  const [summary, setSummary] = useState<string>('…')

  useEffect(() => {
    const stored = window.sessionStorage.getItem(`profile_summary_${userId}`)
    if (stored) {
      setSummary(stored)
    } else {
      const fallback = lang === 'es'
        ? `${displayName} aporta experiencia práctica y vivida que se mapea a categorías de habilidades reconocidas por ESCO. La cuadrícula a continuación muestra el perfil estandarizado.`
        : `${displayName} brings practical, lived experience that maps to internationally recognized ESCO skill categories. The skill grid below shows the standardized profile.`
      setSummary(fallback)
    }
  }, [userId, displayName, lang])

  return (
    <Reveal>
      <div className="card-elevated relative overflow-hidden p-8 mb-10">
        <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">{t('profile.summary_label')}</p>
              <h2 className="font-serif-display text-3xl text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {region && <span>{region} · </span>}
                {FLAG[countryCode] ?? countryCode}
              </p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {t('profile.show_to_employers')}
            </span>
          </div>
          <p className="text-foreground/90 leading-relaxed text-lg mt-4">{summary}</p>
        </div>
      </div>
    </Reveal>
  )
}
