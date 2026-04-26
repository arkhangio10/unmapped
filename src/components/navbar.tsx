'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { Button } from '@/components/ui/button'

const FLAG: Record<string, string> = { PER: '🇵🇪', GHA: '🇬🇭' }

export default function Navbar() {
  const { countryCode, country } = useCountry()

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          UN<span className="text-orange-400">MAPPED</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Dashboard
            </Button>
          </Link>

          <Link href="/admin/config">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:border-orange-400 hover:text-orange-400 gap-1.5">
              <span>{FLAG[countryCode] ?? '🌍'}</span>
              <span className="hidden sm:inline">{country?.country_name ?? countryCode}</span>
            </Button>
          </Link>

          <Link href="/onboarding">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
              Try demo
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
