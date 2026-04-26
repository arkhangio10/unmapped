'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Reveal } from '@/components/reveal'
import { LoadingBulldog } from '@/components/loading-bulldog'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

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
  reachable: 'border-primary/30 bg-primary/10 text-primary',
  stretch: 'border-amber/40 bg-amber/10 text-amber-foreground',
  aspirational: 'border-chart-5/30 bg-chart-5/10 text-chart-5',
}

export default function MatchClient({ userId }: { userId: string }) {
  const t = useT()
  const TYPE_FILTER = [
    { label: t('match.filter_all'), value: 'all' },
    { label: t('match.filter_formal'), value: 'formal' },
    { label: t('match.filter_self'), value: 'self-employment' },
    { label: t('match.filter_gig'), value: 'gig' },
    { label: t('match.filter_training'), value: 'training' },
  ]
  const DISTANCE_LABEL: Record<string, string> = {
    reachable: t('match.reachable'),
    stretch: t('match.stretch'),
    aspirational: t('match.aspirational'),
  }
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/opportunities/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setOpportunities(d.opportunities ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  const filtered = filter === 'all' ? opportunities : opportunities.filter((o) => o.opportunity_type === filter)

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-coral mb-4">{error}</p>
        <Link href={`/profile/${userId}/risk`} className="text-primary underline">
          ← Back to risk
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <LoadingBulldog
        stages={[
          t('loading.match_stage_1'),
          t('loading.match_stage_2'),
          t('loading.match_stage_3'),
          t('loading.match_stage_4'),
        ]}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Reveal>
        <h1 className="font-serif-display text-4xl sm:text-5xl text-foreground mb-2">
          {t('match.title')}
        </h1>
        <p className="text-muted-foreground mb-8">{t('match.subtitle')}</p>
      </Reveal>

      <Reveal delay={150}>
        <div className="flex flex-wrap gap-2 mb-8">
          {TYPE_FILTER.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filter === f.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {filtered.length === 0 && (
        <div className="card-elevated text-center py-12">
          <p className="text-muted-foreground">{t('match.no_results')}</p>
        </div>
      )}

      <div className="space-y-5">
        {filtered.map((opp, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="card-elevated p-6 hover-lift">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg capitalize">{opp.occupation_name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {opp.sector} · <span className="font-data">ISCO {opp.isco_code}</span>
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    DISTANCE_STYLE[opp.distance_from_user]
                  }`}
                >
                  {DISTANCE_LABEL[opp.distance_from_user] ?? opp.distance_from_user}
                </span>
              </div>

              {/* Wage block — visible by design */}
              <div className="grid grid-cols-2 gap-4 mb-5 p-5 rounded-2xl bg-muted/60 border border-border/50">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1 font-medium">
                    {t('match.wage_label')}
                  </p>
                  <p className="font-serif-display text-3xl text-foreground">
                    {opp.median_wage_local.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs">{t('match.wage_local')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1 font-medium">
                    {t('match.wage_usd')}
                  </p>
                  <p className="font-serif-display text-3xl text-primary">
                    ${opp.median_wage_usd.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    {t('match.growth_label')}:{' '}
                    <span className={opp.employment_growth_pct > 0 ? 'text-primary' : 'text-coral'}>
                      {opp.employment_growth_pct > 0 ? (
                        <TrendingUp className="inline h-3 w-3" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3" />
                      )}{' '}
                      {Math.abs(opp.employment_growth_pct).toFixed(1)}%
                    </span>{' '}
                    (2022–2024)
                  </p>
                </div>
              </div>

              <p className="text-foreground/90 text-sm italic mb-4">{opp.reasoning}</p>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">{t('match.skill_match')}</span>
                <Progress value={opp.skill_match_score * 100} className="h-1.5 flex-1" />
                <span className="text-foreground text-xs font-semibold">
                  {Math.round(opp.skill_match_score * 100)}%
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={400}>
        <p className="mt-10 text-center text-xs text-muted-foreground">{t('match.footer')}</p>
      </Reveal>
    </div>
  )
}
