'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface Opportunity {
  isco_code: string
  occupation_name: string
  sector: string
  median_wage_local: number
  median_wage_usd: number
  employment_growth_pct: number
  skill_match_score: number
  opportunity_type: string
  reasoning: string
  distance_from_user: 'reachable' | 'stretch' | 'aspirational'
}

const DISTANCE_STYLE = {
  reachable: 'bg-green-900/40 text-green-400 border-green-700',
  stretch: 'bg-orange-900/40 text-orange-400 border-orange-700',
  aspirational: 'bg-blue-900/40 text-blue-400 border-blue-700',
}

const TYPE_FILTER = [
  { label: 'All', value: 'all' },
  { label: 'Formal', value: 'formal' },
  { label: 'Self-employment', value: 'self-employment' },
  { label: 'Gig', value: 'gig' },
  { label: 'Training', value: 'training' },
]

export default function MatchClient({ userId }: { userId: string }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [_currency, _setCurrency] = useState('PEN')

  useEffect(() => {
    fetch('/api/v1/opportunities/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setOpportunities(d.opportunities ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  const filtered = filter === 'all' ? opportunities : opportunities.filter(o => o.opportunity_type === filter)

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href={`/profile/${userId}/risk`}><Button variant="outline">← Back to risk</Button></Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-64 bg-slate-800" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full bg-slate-800 rounded-xl" />)}
        <p className="text-center text-slate-500 text-sm">Finding your opportunities...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Opportunities for you</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-400">
            Policymaker view →
          </Button>
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_FILTER.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className="focus:outline-none">
            <Badge
              variant={filter === f.value ? 'default' : 'secondary'}
              className={
                filter === f.value
                  ? 'bg-orange-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700'
              }
            >
              {f.label}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="bg-slate-900 border-slate-800 text-center py-12">
          <CardContent>
            <p className="text-slate-400">No opportunities found for this filter.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {filtered.map((opp, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-orange-500/30 transition-colors">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg capitalize">{opp.occupation_name}</h3>
                  <p className="text-slate-400 text-sm">{opp.sector} · ISCO {opp.isco_code}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${DISTANCE_STYLE[opp.distance_from_user]} capitalize`}
                >
                  {opp.distance_from_user}
                </Badge>
              </div>

              {/* Wage — LARGE and prominent */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-800/60 rounded-xl">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Monthly wage</p>
                  <p className="text-3xl font-bold text-white">
                    {opp.median_wage_local.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm">local currency / month</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">USD equivalent</p>
                  <p className="text-3xl font-bold text-orange-400">
                    ${opp.median_wage_usd.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Sector growth:{' '}
                    <span className={opp.employment_growth_pct > 0 ? 'text-green-400' : 'text-red-400'}>
                      {opp.employment_growth_pct > 0 ? '↑' : '↓'} {Math.abs(opp.employment_growth_pct).toFixed(1)}%
                    </span>
                    {' '}(2022–2024)
                  </p>
                </div>
              </div>

              <p className="text-slate-300 text-sm italic mb-4">{opp.reasoning}</p>

              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs">Skill match</span>
                <Progress value={opp.skill_match_score * 100} className="h-1.5 flex-1 bg-slate-800" />
                <span className="text-slate-300 text-xs font-medium">
                  {Math.round(opp.skill_match_score * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-slate-600">
        Wages: ILOSTAT 2023 · Employment growth: ILOSTAT 2022–2024 · World Bank WDI 2024
      </div>
    </div>
  )
}
