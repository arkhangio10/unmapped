'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  const [summary, setSummary] = useState<string>('Generating your summary...')

  useEffect(() => {
    const stored = window.sessionStorage.getItem(`profile_summary_${userId}`)
    if (stored) {
      setSummary(stored)
    } else {
      setSummary(
        `${displayName} brings practical, lived experience that maps to internationally recognized ESCO skill categories. The skill grid below shows the standardized profile.`
      )
    }
  }, [userId, displayName])

  return (
    <Card className="bg-gradient-to-br from-orange-950/40 to-slate-900 border-orange-500/30 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-400 text-sm font-medium mb-1">Professional summary</p>
            <CardTitle className="text-white text-xl">{displayName}</CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              {region && `${region} · `}
              {FLAG[countryCode] ?? countryCode}
            </p>
          </div>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs hidden sm:inline-flex">
            Show this to employers
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-200 leading-relaxed text-lg">{summary}</p>
      </CardContent>
    </Card>
  )
}
