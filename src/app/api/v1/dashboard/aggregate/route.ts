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

    // Aggregate skill gaps — sectors with high growth but potentially unmet demand
    const skillGapBySector = employment
      .filter((e: any) => e.growth_pct > 0)
      .sort((a: any, b: any) => b.growth_pct - a.growth_pct)
      .slice(0, 8)
      .map((e: any) => ({ sector: e.sector, growth_pct: e.growth_pct, employment_2024: e.employment_2024 }))

    // Risk distribution from DB (aggregate across all users for this country)
    const { data: riskRows } = await supabaseAdmin
      .from('risk_assessments')
      .select('risk_band, overall_risk_score')
      .eq('country_calibration', countryCode)

    const riskDist = { low: 0, medium: 0, high: 0 }
    if (riskRows && riskRows.length > 0) {
      for (const r of riskRows) {
        riskDist[r.risk_band as 'low' | 'medium' | 'high']++
      }
    } else {
      // Default illustrative distribution for demo
      riskDist.low = 35
      riskDist.medium = 45
      riskDist.high = 20
    }

    return NextResponse.json({
      country_code: countryCode,
      country_name: country.country_name,
      wdi,
      skill_gaps_by_sector: skillGapBySector,
      risk_distribution: [
        { name: 'Low risk', value: riskDist.low, fill: '#22c55e' },
        { name: 'Medium risk', value: riskDist.medium, fill: '#f97316' },
        { name: 'High risk', value: riskDist.high, fill: '#ef4444' },
      ],
      employment_growth: employment.map((e: any) => ({
        sector: e.sector.split(' ')[0],
        employment_2022: e.employment_2022,
        employment_2024: e.employment_2024,
        growth_pct: e.growth_pct,
      })),
      informal_economy_share: country.informal_economy_share,
      youth_neet_rate: country.youth_neet_rate,
    })
  } catch (err) {
    console.error('[dashboard/aggregate]', err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
