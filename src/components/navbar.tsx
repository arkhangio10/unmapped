'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { useT } from '@/lib/i18n'

const FLAG: Record<string, string> = { PER: '🇵🇪', GHA: '🇬🇭' }

export default function Navbar() {
  const { countryCode, country } = useCountry()
  const t = useT()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-serif-display text-2xl text-foreground">UNMAPPED</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link href="/onboarding" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.onboarding')}
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.dashboard')}
          </Link>
          <Link href="/admin/config" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.config')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/config"
            className="hover-lift inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <span>{FLAG[countryCode] ?? '🌍'}</span>
            <span className="hidden sm:inline">{country?.country_name ?? countryCode}</span>
          </Link>

          <Link
            href="/onboarding"
            className="hover-lift inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {t('nav.map_my_skills')}
          </Link>
        </div>
      </div>
    </header>
  )
}
