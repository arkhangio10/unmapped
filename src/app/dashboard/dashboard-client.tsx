'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/reveal'
import { useCountry } from '@/lib/country-context'
import { useT, useLang } from '@/lib/i18n'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'

const FLAG: Record<string, string> = { PER: '🇵🇪', GHA: '🇬🇭' }

const TEAL = 'oklch(0.48 0.07 195)'
const SLATE = 'oklch(0.55 0.04 260)'

interface KpiData {
  label: string
  value: string
  sub: string
  color: string
  tooltip: string
}

function KpiCard({ kpi, delay }: { kpi: KpiData; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="card-elevated p-5 relative group cursor-help hover:z-50" title={kpi.tooltip}>
        <div className="flex items-start justify-between mb-1">
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-medium">
            {kpi.label}
          </p>
          <Info className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
        <p className={`font-serif-display text-3xl ${kpi.color}`}>{kpi.value}</p>
        <p className="text-muted-foreground text-xs">{kpi.sub}</p>

        {/* Tooltip on hover — positioned ABOVE the card, very high z-index */}
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-0 right-0 bottom-full mb-2 z-[100] rounded-xl bg-foreground text-background p-3 text-xs leading-relaxed shadow-xl pointer-events-none">
          {kpi.tooltip}
          <div className="absolute -bottom-1 left-6 w-2 h-2 rotate-45 bg-foreground" />
        </div>
      </div>
    </Reveal>
  )
}

export default function DashboardClient({ countryCode: initialCode }: { countryCode: string }) {
  const { countryCode: liveCode } = useCountry()
  const countryCode = liveCode ?? initialCode
  const t = useT()
  const lang = useLang()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
    fetch(`/api/v1/dashboard/aggregate?country_code=${countryCode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
  }, [countryCode])

  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <p className="text-coral">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )

  // Use localized name for legend
  const riskData = data.risk_distribution.map((r: any) => ({
    ...r,
    name: lang === 'es' ? r.name_es : r.name,
  }))

  const kpis: KpiData[] = [
    {
      label: t('dashboard.kpi_gdp'),
      value: `$${data.wdi.gdp_per_capita_usd.toLocaleString()}`,
      sub: `${t('dashboard.kpi_gdp_sub')} · ${data.wdi.year}`,
      color: 'text-foreground',
      tooltip: t('dashboard.kpi_gdp_explain'),
    },
    {
      label: t('dashboard.kpi_neet'),
      value: `${Math.round(data.youth_neet_rate * 100)}%`,
      sub: t('dashboard.kpi_neet_sub'),
      color: 'text-coral',
      tooltip: t('dashboard.kpi_neet_explain'),
    },
    {
      label: t('dashboard.kpi_informal'),
      value: `${Math.round(data.informal_economy_share * 100)}%`,
      sub: t('dashboard.kpi_informal_sub'),
      color: 'text-amber-foreground',
      tooltip: t('dashboard.kpi_informal_explain'),
    },
    {
      label: t('dashboard.kpi_internet'),
      value: `${Math.round(data.wdi.internet_penetration * 100)}%`,
      sub: `${t('dashboard.kpi_internet_sub')} · ${data.wdi.year}`,
      color: 'text-primary',
      tooltip: t('dashboard.kpi_internet_explain'),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Reveal>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{FLAG[countryCode] ?? '🌍'}</span>
          <div>
            <h1 className="font-serif-display text-4xl text-foreground">{data.country_name}</h1>
            <p className="text-muted-foreground text-sm">{t('dashboard.title_subtitle')}</p>
          </div>
        </div>
      </Reveal>

      {/* KPI cards with hover explanations */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-10">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} kpi={kpi} delay={i * 80} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Reveal delay={100}>
          <div className="card-elevated p-5">
            <h3 className="font-semibold text-foreground mb-1">{t('dashboard.skill_gap_title')}</h3>
            <p className="text-muted-foreground text-xs mb-4">{t('dashboard.skill_gap_sub')}</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.skill_gaps_by_sector}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 5, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: 'oklch(0.48 0.02 260)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  dataKey="sector"
                  type="category"
                  tick={{ fill: 'oklch(0.30 0.05 200)', fontSize: 11 }}
                  width={130}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: 'oklch(0.95 0.01 200 / 0.4)' }}
                  contentStyle={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.008 80)', borderRadius: 8, color: 'oklch(0.20 0.03 280)' }}
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, t('dashboard.growth_tooltip')]}
                />
                <Bar dataKey="growth_pct" fill={TEAL} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="card-elevated p-5">
            <h3 className="font-semibold text-foreground mb-1">{t('dashboard.risk_dist_title')}</h3>
            <p className="text-muted-foreground text-xs mb-4">{t('dashboard.risk_dist_sub')}</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  paddingAngle={riskData.filter((r: any) => r.value > 0).length > 1 ? 3 : 0}
                  labelLine={false}
                >
                  {riskData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.008 80)', borderRadius: 8, color: 'oklch(0.20 0.03 280)' }}
                  formatter={(v: any, n: any) => [`${v}%`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom legend */}
            <div className="mt-2 flex items-center justify-center gap-4 text-xs flex-wrap">
              {riskData.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold text-foreground tabular-nums">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Employment growth */}
      <Reveal delay={300}>
        <div className="card-elevated p-5 mb-8">
          <h3 className="font-semibold text-foreground mb-1">{t('dashboard.growth_title')}</h3>
          <p className="text-muted-foreground text-xs mb-4">{t('dashboard.growth_sub')}</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.employment_growth} margin={{ left: 8, right: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.008 80)" />
              <XAxis
                dataKey="sector"
                tick={{ fill: 'oklch(0.48 0.02 260)', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis
                tick={{ fill: 'oklch(0.48 0.02 260)', fontSize: 11 }}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: 'oklch(0.95 0.01 200 / 0.4)' }}
                contentStyle={{ backgroundColor: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.008 80)', borderRadius: 8, color: 'oklch(0.20 0.03 280)' }}
                formatter={(v: any, name: any, props: any) => {
                  const sectorFull = props?.payload?.sectorFull
                  return [Number(v).toLocaleString(), name + (sectorFull ? ` (${sectorFull})` : '')]
                }}
              />
              <Legend wrapperStyle={{ color: 'oklch(0.48 0.02 260)', fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="employment_2022" name="2022" fill={SLATE} radius={[3, 3, 0, 0]} />
              <Bar dataKey="employment_2024" name="2024" fill={TEAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Reveal>

      <p className="text-center text-xs text-muted-foreground space-x-3">
        <span>ILOSTAT 2023–2024</span><span>·</span>
        <span>World Bank WDI 2024</span><span>·</span>
        <span>ESCO v1.2.0</span><span>·</span>
        <span>Frey-Osborne 2013 (Oxford)</span>
      </p>
    </div>
  )
}
