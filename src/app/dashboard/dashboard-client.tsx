'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountry } from '@/lib/country-context'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'

const FLAG: Record<string, string> = { PER: '🇵🇪', GHA: '🇬🇭' }

export default function DashboardClient({ countryCode: initialCode }: { countryCode: string }) {
  const { countryCode: liveCode } = useCountry()
  const countryCode = liveCode ?? initialCode
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
    fetch(`/api/v1/dashboard/aggregate?country_code=${countryCode}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
  }, [countryCode])

  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
      <Skeleton className="h-24 w-full bg-slate-800 rounded-xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 bg-slate-800 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 w-full bg-slate-800 rounded-xl" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{FLAG[countryCode] ?? '🌍'}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">Policymaker Dashboard</h1>
            <p className="text-slate-400">{data.country_name} · Labor market signals</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">GDP per capita</p>
              <p className="text-2xl font-bold text-white">${data.wdi.gdp_per_capita_usd.toLocaleString()}</p>
              <p className="text-slate-500 text-xs">USD · {data.wdi.year}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Youth NEET rate</p>
              <p className="text-2xl font-bold text-orange-400">{Math.round(data.youth_neet_rate * 100)}%</p>
              <p className="text-slate-500 text-xs">Not in education or employment</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Informal economy</p>
              <p className="text-2xl font-bold text-yellow-400">{Math.round(data.informal_economy_share * 100)}%</p>
              <p className="text-slate-500 text-xs">of total employment</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Internet access</p>
              <p className="text-2xl font-bold text-blue-400">{Math.round(data.wdi.internet_penetration * 100)}%</p>
              <p className="text-slate-500 text-xs">population · {data.wdi.year}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Skill gap by sector */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Skill Gap by Sector</CardTitle>
            <p className="text-slate-500 text-xs">Sectors with highest employment growth 2022–2024</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.skill_gaps_by_sector} layout="vertical" margin={{ left: 8, right: 20 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="sector" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Growth']}
                />
                <Bar dataKey="growth_pct" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk distribution pie */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Automation Exposure Distribution</CardTitle>
            <p className="text-slate-500 text-xs">% of profiled youth by risk band</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.risk_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: any) => `${name}: ${value}%`}
                >
                  {data.risk_distribution.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employment growth line chart */}
      <Card className="bg-slate-900 border-slate-800 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Employment Growth by Sector (2022–2024)</CardTitle>
          <p className="text-slate-500 text-xs">Absolute employment change · ILOSTAT</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.employment_growth} margin={{ left: 8, right: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="sector" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v) => [Number(v).toLocaleString(), '']}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 24 }} />
              <Bar dataKey="employment_2022" name="2022" fill="#334155" radius={[2,2,0,0]} />
              <Bar dataKey="employment_2024" name="2024" fill="#f97316" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data citations */}
      <div className="text-center text-xs text-slate-600 space-x-3">
        <span>ILOSTAT 2023–2024</span>
        <span>·</span>
        <span>World Bank WDI 2024</span>
        <span>·</span>
        <span>ESCO v1.2.0</span>
        <span>·</span>
        <span>Frey-Osborne 2013 (Oxford)</span>
      </div>
    </div>
  )
}
