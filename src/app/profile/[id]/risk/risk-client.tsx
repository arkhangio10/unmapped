'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { LoadingBulldog } from '@/components/loading-bulldog'
import { useT } from '@/lib/i18n'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface RiskData {
  overall_risk_score: number
  risk_band: 'low' | 'medium' | 'high'
  durable_skills: { skill_name: string; confidence: number }[]
  at_risk_skills: { skill_name: string; confidence: number }[]
  recommended_adjacent_skills: { skill: string; rationale: string }[]
  explanation: string
  user_name: string
}

const BAND_COLOR = {
  low: 'oklch(0.48 0.07 195)',  // teal
  medium: 'oklch(0.78 0.16 75)', // amber
  high: 'oklch(0.70 0.17 28)',   // coral
}

export default function RiskClient({ userId }: { userId: string }) {
  const t = useT()
  const BAND_LABEL = { low: t('risk.risk_low'), medium: t('risk.risk_medium'), high: t('risk.risk_high') }
  const [data, setData] = useState<RiskData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/v1/risk/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
  }, [userId])

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-coral mb-4">{error}</p>
        <Link href={`/profile/${userId}`} className="text-primary underline">
          ← Back to profile
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <LoadingBulldog
        stages={[
          t('loading.risk_stage_1'),
          t('loading.risk_stage_2'),
          t('loading.risk_stage_3'),
          t('loading.risk_stage_4'),
        ]}
      />
    )
  }

  const riskPct = Math.round(data.overall_risk_score * 100)
  const gaugeColor = BAND_COLOR[data.risk_band]
  const gaugeData = [{ value: riskPct, fill: gaugeColor }]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Reveal>
        <h1 className="font-serif-display text-4xl sm:text-5xl text-foreground mb-2">
          {t('risk.title')}
        </h1>
        <p className="text-muted-foreground mb-10">{t('risk.subtitle')}</p>
      </Reveal>

      {/* Risk gauge */}
      <Reveal delay={150}>
        <div className="card-elevated p-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-48 h-48 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="90%"
                  data={gaugeData}
                  startAngle={210}
                  endAngle={-30}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'oklch(0.94 0.01 80)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif-display text-5xl text-foreground">{riskPct}%</span>
                <span className="text-sm font-medium" style={{ color: gaugeColor }}>
                  {BAND_LABEL[data.risk_band]}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-foreground/90 leading-relaxed text-lg italic">
                &ldquo;{data.explanation}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Durable vs at-risk */}
      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <Reveal delay={250}>
          <div className="card-elevated p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t('risk.durable_title')}</h3>
            </div>
            <div className="space-y-2">
              {data.durable_skills.length === 0 && (
                <p className="text-muted-foreground text-sm">{t('risk.no_durable')}</p>
              )}
              {data.durable_skills.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground capitalize">
                  <span className="text-primary">✓</span>
                  <span>{s.skill_name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={350}>
          <div className="card-elevated p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-coral" />
              <h3 className="font-semibold text-foreground">{t('risk.at_risk_title')}</h3>
            </div>
            <div className="space-y-2">
              {data.at_risk_skills.length === 0 && (
                <p className="text-muted-foreground text-sm">{t('risk.no_at_risk')}</p>
              )}
              {data.at_risk_skills.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground capitalize">
                  <span className="text-coral">⚠</span>
                  <span>{s.skill_name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={450}>
        <h2 className="font-serif-display text-2xl text-foreground mb-4">{t('risk.recommendations_title')}</h2>
      </Reveal>

      <div className="space-y-3 mb-10">
        {data.recommended_adjacent_skills.map((rec, i) => (
          <Reveal key={i} delay={500 + i * 100}>
            <div className="card-elevated p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{rec.skill}</h3>
                  <p
                    className={`text-muted-foreground text-sm mt-1 ${
                      expanded === i ? '' : 'line-clamp-1'
                    }`}
                  >
                    {rec.rationale}
                  </p>
                </div>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                >
                  {expanded === i ? t('risk.less') : t('risk.why')}
                  <ChevronDown className={`h-3 w-3 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={800}>
        <Link
          href={`/profile/${userId}/match`}
          className="hover-lift block w-full text-center rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t('risk.continue_match')} <ArrowRight className="inline h-4 w-4 ml-1" />
        </Link>
      </Reveal>
    </div>
  )
}
