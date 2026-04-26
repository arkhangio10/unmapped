export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getConfigByCode } from '@/lib/config-loader'
import { extractCandidateSkills, matchToEsco, generateHumanReadableSummary } from '@/lib/esco/matcher'

const schema = z.object({
  display_name: z.string().min(1).max(100),
  age: z.number().int().min(14).max(65).optional(),
  country_code: z.enum(['PER', 'GHA']),
  region: z.string().max(100).optional(),
  education_level: z.string().optional(),
  languages: z.array(z.string()).optional(),
  raw_self_description: z.string().min(20).max(3000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const country = getConfigByCode(data.country_code)

    // Insert user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        display_name: data.display_name,
        age: data.age ?? null,
        country_code: data.country_code,
        region: data.region ?? null,
        education_level: data.education_level ?? null,
        languages: data.languages ?? null,
        raw_self_description: data.raw_self_description,
      })
      .select()
      .single()

    if (userError) throw userError

    // Run matcher pipeline (3 LLM calls max)
    const candidates = await extractCandidateSkills(data.raw_self_description, country)
    const matchedSkills = await matchToEsco(candidates, data.raw_self_description, country.primary_language)
    const summary = await generateHumanReadableSummary(
      matchedSkills,
      {
        name: data.display_name,
        age: data.age ?? 20,
        region: data.region ?? country.demo_persona.region,
        education_level: data.education_level ?? 'secondary',
      },
      country
    )

    // Insert skills profile
    if (matchedSkills.length > 0) {
      const skillRows = matchedSkills.map(s => ({
        user_id: user.id,
        esco_skill_id: s.esco_id,
        skill_name: s.skill_name,
        skill_category: s.skill_category,
        confidence: s.confidence,
        source: s.source,
        human_readable_explanation: s.evidence,
      }))

      const { error: skillError } = await supabaseAdmin.from('skills_profile').insert(skillRows)
      if (skillError) console.error('[profile/create] skill insert error:', skillError)
    }

    return NextResponse.json({
      user_id: user.id,
      skills_profile: matchedSkills,
      human_readable_summary: summary,
      candidate_count: candidates.length,
      mapped_count: matchedSkills.length,
    })
  } catch (err) {
    console.error('[profile/create]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
