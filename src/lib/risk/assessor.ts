import fs from 'fs'
import path from 'path'
import { callClaude } from '@/lib/anthropic'
import { getFreyOsborneScore } from '@/lib/frey-osborne/loader'
import { supabaseAdmin } from '@/lib/supabase'
import { CountryConfig, SkillRef, AdjacentSkill } from '@/types'

interface SkillRow {
  esco_skill_id: string
  skill_name: string
  skill_category: string
  confidence: number
}

const escoToIscoMap: Record<string, string[]> = (() => {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'esco_to_isco_map.json'), 'utf-8')
    return JSON.parse(raw) as Record<string, string[]>
  } catch {
    return {}
  }
})()

function getCalibratedScore(rawScore: number, category: string, calibration: CountryConfig['automation_calibration']): number {
  if (category === 'mechanical' || category === 'domain') {
    return rawScore * calibration.manual_routine
  }
  if (category === 'digital' || category === 'business') {
    return rawScore * calibration.cognitive_routine
  }
  return rawScore * calibration.manual_nonroutine
}

export async function assessRisk(userId: string, country: CountryConfig) {
  const { data: skills, error } = await supabaseAdmin
    .from('skills_profile')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  if (!skills || skills.length === 0) throw new Error('No skills found for user')

  // Score each skill
  const scored = (skills as SkillRow[]).map((skill) => {
    const iscoCodes: string[] = escoToIscoMap[skill.esco_skill_id] ?? []
    const rawScores = iscoCodes.length > 0
      ? iscoCodes.map(code => getFreyOsborneScore(code))
      : [0.5]
    const avgRaw = rawScores.reduce((a, b) => a + b, 0) / rawScores.length
    const calibrated = getCalibratedScore(avgRaw, skill.skill_category ?? 'soft', country.automation_calibration)
    return { skill, calibrated }
  })

  // Weighted average
  const totalConfidence = scored.reduce((s, x) => s + x.skill.confidence, 0)
  const weightedRisk = scored.reduce((s, x) => s + x.skill.confidence * x.calibrated, 0) / (totalConfidence || 1)

  const risk_band: 'low' | 'medium' | 'high' =
    weightedRisk < 0.3 ? 'low' : weightedRisk < 0.6 ? 'medium' : 'high'

  const durable_skills: SkillRef[] = scored
    .filter(x => x.calibrated < 0.35)
    .map(x => ({ esco_skill_id: x.skill.esco_skill_id, skill_name: x.skill.skill_name, confidence: x.skill.confidence }))

  const at_risk_skills: SkillRef[] = scored
    .filter(x => x.calibrated > 0.6)
    .map(x => ({ esco_skill_id: x.skill.esco_skill_id, skill_name: x.skill.skill_name, confidence: x.skill.confidence }))

  const recommended_adjacent_skills = await recommendAdjacentSkills(durable_skills, skills[0]?.display_name ?? 'you', country)
  const explanation = await generateRiskExplanation(weightedRisk, risk_band, durable_skills, at_risk_skills, skills[0]?.display_name ?? 'you', country)

  // Fetch user name
  const { data: user } = await supabaseAdmin.from('users').select('display_name').eq('id', userId).single()
  const userName = user?.display_name ?? 'you'

  return {
    overall_risk_score: Math.round(weightedRisk * 100) / 100,
    risk_band,
    durable_skills,
    at_risk_skills,
    recommended_adjacent_skills,
    explanation,
    country_calibration: country.country_code,
    user_name: userName,
  }
}

async function recommendAdjacentSkills(
  durableSkills: SkillRef[],
  name: string,
  country: CountryConfig
): Promise<AdjacentSkill[]> {
  const durableList = durableSkills.map(s => s.skill_name).join(', ') || 'practical manual and interpersonal skills'
  const langName = country.primary_language === 'es' ? 'Spanish' : 'English'

  const systemPrompt = `You are a career navigator for youth in ${country.country_name}. Given a person's durable AI-resilient skills, recommend 3 specific adjacent skills they should learn next. Each recommendation must: (1) build naturally on their existing skills, (2) be resilient to automation through 2030, (3) be locally relevant — reference real industries or job markets in ${country.country_name}.

IMPORTANT: Write the "skill" name and "rationale" text in ${langName}. The JSON keys must remain in English.

Return ONLY a JSON array with no markdown: [{"skill": string (in ${langName}), "rationale": string (in ${langName}, max 2 sentences, mention a specific local industry or trend)}]`

  const userPrompt = `Person: ${name} in ${country.country_name}. Their durable skills include: ${durableList}`

  try {
    const response = await callClaude(systemPrompt, userPrompt, 600)
    const cleaned = response.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as AdjacentSkill[]
  } catch {
    if (country.primary_language === 'es') {
      return [
        { skill: 'Administración digital de negocios', rationale: `Demanda creciente de habilidades de gestión de pequeños negocios en la economía informal de ${country.country_name}.` },
        { skill: 'Servicio al cliente en inglés', rationale: `Los trabajadores bilingües ganan salarios significativamente más altos en turismo y sectores de exportación.` },
        { skill: 'Educación financiera básica', rationale: `Los microempresarios con habilidades contables ganan en promedio un 30% más.` },
      ]
    }
    return [
      { skill: 'Digital business administration', rationale: `Growing demand for small business management skills in ${country.country_name}'s informal economy.` },
      { skill: 'Customer service in English', rationale: `Bilingual service workers command significantly higher wages in tourism and export sectors.` },
      { skill: 'Basic financial literacy', rationale: `Micro-enterprise owners with accounting skills earn 30% more on average.` },
    ]
  }
}

async function generateRiskExplanation(
  score: number,
  band: string,
  durable: SkillRef[],
  atRisk: SkillRef[],
  name: string,
  country: CountryConfig
): Promise<string> {
  const langName = country.primary_language === 'es' ? 'Spanish' : 'English'
  const systemPrompt = `You are an honest workforce analyst. Write a 2-3 sentence plain-language assessment of a person's automation risk. Be honest and calibrated — do not say "you'll be fine" or "AI won't affect you." Always give a calibrated, actionable assessment. Write entirely in ${langName}. Address the person by their first name.`

  const durableNames = durable.map(s => s.skill_name).slice(0, 3).join(', ')
  const atRiskNames = atRisk.map(s => s.skill_name).slice(0, 2).join(', ')

  const userPrompt = `Name: ${name}, Country: ${country.country_name}, Overall automation risk: ${Math.round(score * 100)}% (${band} risk band). Durable skills: ${durableNames || 'none identified'}. At-risk skills: ${atRiskNames || 'none'}.`

  try {
    return await callClaude(systemPrompt, userPrompt, 250)
  } catch {
    if (country.primary_language === 'es') {
      return `Tu riesgo de automatización es del ${Math.round(score * 100)}% — clasificado como riesgo ${band} para el mercado laboral de ${country.country_name}. Enfócate en desarrollar tus habilidades duraderas mientras adaptas las habilidades en riesgo hacia aplicaciones más complejas.`
    }
    return `Your automation risk is assessed at ${Math.round(score * 100)}% — classified as ${band} risk for the ${country.country_name} labor market. Focus on building your durable skills while adapting the at-risk ones toward more complex applications.`
  }
}
