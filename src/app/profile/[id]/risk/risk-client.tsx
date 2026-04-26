'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

const BAND_COLOR = { low: '#22c55e', medium: '#f97316', high: '#ef4444' }
const BAND_BG = { low: 'border-green-700 bg-green-900/20', medium: 'border-orange-700 bg-orange-900/20', high: 'border-red-700 bg-red-900/20' }

export default function RiskClient({ userId }: { userId: string }) {
  const [data, setData] = useState<RiskData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/v1/risk/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
  }, [userId])

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href={`/profile/${userId}`}>
          <Button variant="outline">← Back to profile</Button>
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-64 bg-slate-800" />
        <Skeleton className="h-64 w-full bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 bg-slate-800 rounded-xl" />
          <Skeleton className="h-48 bg-slate-800 rounded-xl" />
        </div>
        <p className="text-center text-slate-500 text-sm">Assessing your automation risk...</p>
      </div>
    )
  }

  const riskPct = Math.round(data.overall_risk_score * 100)
  const gaugeColor = BAND_COLOR[data.risk_band]
  const gaugeData = [{ value: riskPct, fill: gaugeColor }]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">AI Readiness Assessment</h1>

      {/* Risk gauge */}
      <Card className={`mb-8 border ${BAND_BG[data.risk_band]}`}>
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
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
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#1e293b' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{riskPct}%</span>
              <span className="text-sm" style={{ color: gaugeColor }}>
                {data.risk_band} risk
              </span>
            </div>
          </div>
          <div>
            <p className="text-slate-300 leading-relaxed italic text-lg">
              &ldquo;{data.explanation}&rdquo;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Durable vs at-risk */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-900 border-green-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              ✓ Your durable skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.durable_skills.length === 0 && (
              <p className="text-slate-500 text-sm">None identified at low risk.</p>
            )}
            {data.durable_skills.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-green-500">✓</span>
                <span className="capitalize">{s.skill_name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-orange-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-400 text-base flex items-center gap-2">
              ⚠ Skills at risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.at_risk_skills.length === 0 && (
              <p className="text-slate-500 text-sm">No high-risk skills identified.</p>
            )}
            {data.at_risk_skills.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-orange-500">⚠</span>
                <span className="capitalize">{s.skill_name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended next skills */}
      <h2 className="text-xl font-bold text-white mb-4">Recommended next skills</h2>
      <div className="space-y-4 mb-8">
        {data.recommended_adjacent_skills.map((rec, i) => (
          <Card key={i} className="bg-slate-900 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{rec.skill}</h3>
                  {expanded === i && (
                    <p className="text-slate-400 text-sm mt-1">{rec.rationale}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-orange-400 text-xs"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  {expanded === i ? 'Less' : 'Why?'}
                </Button>
              </div>
              {expanded !== i && (
                <p className="text-slate-500 text-sm mt-1 line-clamp-1">{rec.rationale}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href={`/profile/${userId}/match`}>
        <Button className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-6 text-lg rounded-xl">
          See opportunities matched to me →
        </Button>
      </Link>
    </div>
  )
}
