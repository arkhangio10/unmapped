import fs from 'fs'
import path from 'path'
import { callClaude } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase'
import { CountryConfig, WageEntry, EmploymentEntry } from '@/types'

const escoToIscoMap: Record<string, string[]> = (() => {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'esco_to_isco_map.json'), 'utf-8')
    return JSON.parse(raw)
  } catch { return {} }
})()

function loadWages(country: CountryConfig): WageEntry[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', country.data_sources.wages), 'utf-8')
    return JSON.parse(raw)
  } catch { return [] }
}

function loadEmployment(country: CountryConfig): EmploymentEntry[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', country.data_sources.employment), 'utf-8')
    return JSON.parse(raw)
  } catch { return [] }
}

export async function matchOpportunities(userId: string, country: CountryConfig) {
  const { data: skills } = await supabaseAdmin
    .from('skills_profile')
    .select('*')
    .eq('user_id', userId)

  if (!skills || skills.length === 0) return []

  const wages = loadWages(country)
  const employment = loadEmployment(country)

  // Build a wage and employment lookup by isco_code
  const wageMap = new Map(wages.map(w => [w.isco_code, w]))
  const employmentMap = new Map(employment.map(e => [e.isco_code, e]))

  // Get all ISCO codes relevant to user skills
  const relevantIsco = new Set<string>()
  for (const skill of skills) {
    const codes = escoToIscoMap[skill.esco_skill_id] ?? []
    codes.forEach(c => relevantIsco.add(c))
  }

  // Score each ISCO opportunity
  type ScoredOpportunity = {
    isco_code: string
    wage: WageEntry
    employment: EmploymentEntry | undefined
    skill_match_score: number
    composite_score: number
  }

  const medianWageLocal = wages.reduce((s, w) => s + w.median_monthly_wage_local, 0) / (wages.length || 1)

  const opportunities: ScoredOpportunity[] = []
  for (const iscoCode of relevantIsco) {
    const wage = wageMap.get(iscoCode)
    if (!wage) continue

    const emp = employmentMap.get(iscoCode)

    // Skill match: fraction of user skills that map to this ISCO
    const matchingSkills = skills.filter((s: any) =>
      (escoToIscoMap[s.esco_skill_id] ?? []).includes(iscoCode)
    )
    const skillMatch = matchingSkills.reduce((s: number, sk: any) => s + sk.confidence, 0) /
      Math.max(skills.length, 1)

    const wageRelative = Math.min(wage.median_monthly_wage_local / (medianWageLocal || 1), 2) / 2
    const growthRate = emp ? Math.min(Math.max(emp.growth_pct / 50, 0), 1) : 0.3
    const composite = 0.4 * skillMatch + 0.3 * wageRelative + 0.3 * growthRate

    opportunities.push({ isco_code: iscoCode, wage, employment: emp, skill_match_score: skillMatch, composite_score: composite })
  }

  opportunities.sort((a, b) => b.composite_score - a.composite_score)
  const top5 = opportunities.slice(0, 5)

  // Generate reasoning for each opportunity
  const { data: user } = await supabaseAdmin.from('users').select('display_name, region').eq('id', userId).single()
  const userName = user?.display_name ?? 'you'
  const userRegion = user?.region ?? country.demo_persona.region

  const lang = country.primary_language === 'es' ? 'Spanish' : 'English'
  const isSpanish = country.primary_language === 'es'

  const results = await Promise.all(
    top5.map(async (opp) => {
      const growthStr = opp.employment
        ? `${opp.employment.growth_pct > 0 ? '+' : ''}${opp.employment.growth_pct.toFixed(1)}%`
        : (isSpanish ? 'datos de crecimiento no disponibles' : 'growth data unavailable')

      const prompt = isSpanish
        ? `Escribe una sola oración (máx 20 palabras) explicando por qué ${userName} en ${userRegion} es una buena opción para el rol de ${opp.wage.occupation_name} en ${country.country_name}. Menciona el salario de ${country.currency} ${opp.wage.median_monthly_wage_local}/mes o el crecimiento sectorial de ${growthStr}.`
        : `Write a single sentence (max 20 words) explaining why ${userName} in ${userRegion} is a good fit for the role of ${opp.wage.occupation_name} in ${country.country_name}. Mention the wage of ${country.currency} ${opp.wage.median_monthly_wage_local}/month or the sector growth of ${growthStr}.`

      const systemPrompt = isSpanish
        ? `Eres un asesor de carrera. Escribe una oración específica fundamentada en los números reales proporcionados. Responde en ${lang}.`
        : `You are a career advisor. Write one specific sentence grounded in the actual numbers provided. Reply in ${lang}.`

      let reasoning = ''
      try {
        reasoning = await callClaude(systemPrompt, prompt, 80)
      } catch {
        reasoning = isSpanish
          ? `Buena coincidencia con el sector ${opp.wage.sector}. Salario: ${country.currency} ${opp.wage.median_monthly_wage_local}/mes.`
          : `Strong skill match with ${opp.wage.sector} sector. Wage: ${country.currency} ${opp.wage.median_monthly_wage_local}/month.`
      }

      const distance: 'reachable' | 'stretch' | 'aspirational' =
        opp.composite_score > 0.6 ? 'reachable' : opp.composite_score > 0.35 ? 'stretch' : 'aspirational'

      const opportunityType = opp.wage.sector.includes('Agriculture') ? 'formal'
        : opp.composite_score > 0.5 ? 'formal'
        : opp.wage.sector.includes('Transport') ? 'gig'
        : 'self-employment'

      return {
        isco_code: opp.isco_code,
        occupation_name: opp.wage.occupation_name,
        sector: opp.wage.sector,
        median_wage_local: opp.wage.median_monthly_wage_local,
        median_wage_usd: opp.wage.median_monthly_wage_usd,
        employment_growth_pct: opp.employment?.growth_pct ?? 0,
        skill_match_score: Math.round(opp.skill_match_score * 100) / 100,
        opportunity_type: opportunityType,
        reasoning: reasoning.trim(),
        distance_from_user: distance,
      }
    })
  )

  return results
}
