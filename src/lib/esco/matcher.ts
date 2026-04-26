import { callClaude } from '@/lib/anthropic'
import { getEscoSkills } from './loader'
import { CountryConfig } from '@/types'

interface CandidateSkill {
  candidate_skill: string
  evidence: string
  category: string
}

interface MatchedSkill {
  esco_id: string
  skill_name: string
  skill_category: string
  confidence: number
  source: 'self-reported' | 'llm-inferred'
  evidence: string
}

export async function extractCandidateSkills(
  rawText: string,
  country: CountryConfig
): Promise<CandidateSkill[]> {
  const systemPrompt = `You are a skills extraction expert specializing in informal economies in low- and middle-income countries like ${country.country_name}. Given a person's free-text description of themselves, extract EVERY plausible skill they demonstrate or mention — including informal, self-taught, family-business, and soft skills. Over-extract; we would rather have false positives than miss something. Return ONLY a JSON array with no markdown, no explanation: [{"candidate_skill": string, "evidence": string (the exact phrase from input), "category": string (one of: mechanical, digital, language, soft, business, domain)}]. Do not invent skills not grounded in the text.`

  const response = await callClaude(systemPrompt, rawText, 1024)

  try {
    const cleaned = response.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as CandidateSkill[]
  } catch {
    return []
  }
}

export async function matchToEsco(
  candidates: CandidateSkill[],
  rawText: string,
  language: string = 'en'
): Promise<MatchedSkill[]> {
  const escoSkills = getEscoSkills()

  // Pre-filter ESCO list to top 30 by keyword overlap with candidates + raw text
  const allWords = new Set([
    ...rawText.toLowerCase().split(/\W+/),
    ...candidates.flatMap(c => c.candidate_skill.toLowerCase().split(/\W+/))
  ])

  const scored = escoSkills.map(skill => {
    const skillWords = (skill.skill_name + ' ' + skill.description).toLowerCase().split(/\W+/)
    const overlap = skillWords.filter(w => w.length > 3 && allWords.has(w)).length
    return { skill, overlap }
  })
  scored.sort((a, b) => b.overlap - a.overlap)
  // Use a larger pool so skill-rich profiles get full coverage
  const topN = scored.slice(0, 50).map(s => s.skill)

  const escoListText = topN
    .map(s => `${s.esco_id}|${s.skill_name}|${s.skill_category}|${s.description.slice(0, 80)}`)
    .join('\n')

  const candidateListText = candidates.map(c => `${c.candidate_skill} (${c.category})`).join('\n')

  const langName = language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'

  const systemPrompt = `You are a labor market taxonomy expert. Match candidate skills extracted from a person's description to ESCO skill entries. For each match, assign a confidence score 0.0–1.0 and determine source: 'self-reported' if the skill was explicitly stated, 'llm-inferred' if implied.

IMPORTANT: Translate skill_name and evidence to ${langName}. The esco_id and skill_category must remain in English (universal codes). Use natural ${langName} phrasing for skill names that a layperson would understand.

Return ONLY a JSON array with no markdown: [{"esco_id": string, "skill_name": string (in ${langName}), "skill_category": string (English), "confidence": number, "source": "self-reported"|"llm-inferred", "evidence": string (in ${langName})}]. Return up to 12 matches if the candidate skills justify it — but ONLY include high-quality matches (confidence > 0.5). Quality over quantity.`

  const userPrompt = `Candidate skills from the person's description:\n${candidateListText}\n\nAvailable ESCO skills (id|name|category|description):\n${escoListText}`

  const response = await callClaude(systemPrompt, userPrompt, 2000)

  try {
    const cleaned = response.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as MatchedSkill[]
  } catch {
    // Fallback: return best keyword match
    return topN.slice(0, 5).map(s => ({
      esco_id: s.esco_id,
      skill_name: s.skill_name,
      skill_category: s.skill_category,
      confidence: 0.6,
      source: 'llm-inferred' as const,
      evidence: 'keyword match'
    }))
  }
}

export async function generateHumanReadableSummary(
  skills: MatchedSkill[],
  demographics: { name: string; age: number; region: string; education_level: string },
  country: CountryConfig
): Promise<string> {
  const language = country.primary_language === 'es' ? 'Spanish' : 'English'
  const skillList = skills.map(s => `${s.skill_name} (ESCO ${s.esco_id})`).join(', ')

  const systemPrompt = `You are writing a 2-3 sentence professional summary that this person will show to potential employers. Frame their informal experience as legitimate professional experience. Mention specific ISCO occupational categories that align with their skills. Be specific, dignified, and grounded — do not exaggerate. Write entirely in ${language} — every word, including occupation names. Address the person by their first name. Do not use jargon a non-expert would not understand. Do not mention ESCO IDs in the summary text.

CRITICAL: Output PLAIN TEXT only — no markdown headers (#), no bold (**), no bullet points, no titles, no labels like "Resumen Profesional:". Just write the 2-3 sentences directly. The first character of your output must be a capital letter starting the first sentence.`

  const userPrompt = `Name: ${demographics.name}, Age: ${demographics.age}, Region: ${demographics.region}, Country: ${country.country_name}, Education: ${demographics.education_level}\nIdentified skills: ${skillList}`

  const raw = await callClaude(systemPrompt, userPrompt, 300)
  // Defensive cleanup: strip any markdown that slipped through
  return raw
    .replace(/^#+\s*/gm, '')           // remove leading #
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
    .replace(/^\s*[-*]\s+/gm, '')      // remove bullet markers
    .replace(/^[A-Z][a-záéíóúñ\s]+:\s*/i, '') // strip a "Title:" prefix if any
    .trim()
}
