export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getConfigByCode } from '@/lib/config-loader'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const countryCode = searchParams.get('country_code') ?? 'PER'
    const country = getConfigByCode(countryCode.toUpperCase())

    const employmentRaw = fs.readFileSync(
      path.join(process.cwd(), 'data', country.data_sources.employment),
      'utf-8'
    )
    const wdiRaw = fs.readFileSync(
      path.join(process.cwd(), 'data', country.data_sources.macro),
      'utf-8'
    )

    const employment = JSON.parse(employmentRaw)
    const wdi = JSON.parse(wdiRaw)

    // Group by sector and take the max growth — deduplicates "Tecnología y TIC" duplicates
    const sectorMap = new Map<string, { growth: number; employment: number }>()
    for (const e of employment) {
      if (e.growth_pct <= 0) continue
      const existing = sectorMap.get(e.sector)
      if (!existing || e.growth_pct > existing.growth) {
        sectorMap.set(e.sector, { growth: e.growth_pct, employment: e.employment_2024 })
      }
    }
    const skillGapBySector = Array.from(sectorMap.entries())
      .sort(([, a], [, b]) => b.growth - a.growth)
      .slice(0, 8)
      .map(([sector, v]) => ({ sector, growth_pct: v.growth, employment_2024: v.employment }))

    // Risk distribution as PERCENTAGES (not raw counts)
    const { data: riskRows } = await supabaseAdmin
      .from('risk_assessments')
      .select('risk_band')
      .eq('country_calibration', countryCode)

    const counts = { low: 0, medium: 0, high: 0 }
    if (riskRows && riskRows.length > 0) {
      for (const r of riskRows) {
        counts[r.risk_band as 'low' | 'medium' | 'high']++
      }
    } else {
      // Default illustrative distribution if no users yet
      counts.low = 35
      counts.medium = 45
      counts.high = 20
    }
    const total = counts.low + counts.medium + counts.high || 1
    const riskDist = {
      low: Math.round((counts.low / total) * 100),
      medium: Math.round((counts.medium / total) * 100),
      high: Math.round((counts.high / total) * 100),
    }

    // Aggregate employment growth too — group by sector, sum
    const employmentBySector = new Map<string, { e2022: number; e2024: number }>()
    for (const e of employment) {
      const existing = employmentBySector.get(e.sector) ?? { e2022: 0, e2024: 0 }
      existing.e2022 += e.employment_2022
      existing.e2024 += e.employment_2024
      employmentBySector.set(e.sector, existing)
    }
    const employmentGrowth = Array.from(employmentBySector.entries())
      .sort(([, a], [, b]) => b.e2024 - a.e2024)
      .slice(0, 8)
      .map(([sector, v]) => ({
        sector: sector.length > 14 ? sector.slice(0, 13) + '…' : sector,
        sectorFull: sector,
        employment_2022: v.e2022,
        employment_2024: v.e2024,
        growth_pct: v.e2022 > 0 ? ((v.e2024 - v.e2022) / v.e2022) * 100 : 0,
      }))

    return NextResponse.json({
      country_code: countryCode,
      country_name: country.country_name,
      wdi,
      skill_gaps_by_sector: skillGapBySector,
      risk_distribution: [
        { name: 'Low risk', name_es: 'Riesgo bajo', value: riskDist.low, fill: 'oklch(0.48 0.07 195)' },
        { name: 'Medium risk', name_es: 'Riesgo medio', value: riskDist.medium, fill: 'oklch(0.78 0.16 75)' },
        { name: 'High risk', name_es: 'Riesgo alto', value: riskDist.high, fill: 'oklch(0.70 0.17 28)' },
      ],
      employment_growth: employmentGrowth,
      informal_economy_share: country.informal_economy_share,
      youth_neet_rate: country.youth_neet_rate,
    })
  } catch (err) {
    console.error('[dashboard/aggregate]', err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
