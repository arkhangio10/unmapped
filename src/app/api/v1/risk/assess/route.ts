export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getConfigByCode } from '@/lib/config-loader'
import { assessRisk } from '@/lib/risk/assessor'

const schema = z.object({ user_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id } = schema.parse(body)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('country_code')
      .eq('id', user_id)
      .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const country = getConfigByCode(user.country_code)
    const assessment = await assessRisk(user_id, country)

    const { error: insertError } = await supabaseAdmin.from('risk_assessments').insert({
      user_id,
      overall_risk_score: assessment.overall_risk_score,
      risk_band: assessment.risk_band,
      durable_skills: assessment.durable_skills,
      at_risk_skills: assessment.at_risk_skills,
      recommended_adjacent_skills: assessment.recommended_adjacent_skills,
      explanation: assessment.explanation,
      country_calibration: assessment.country_calibration,
    })

    if (insertError) console.error('[risk/assess] insert error:', insertError)

    return NextResponse.json(assessment)
  } catch (err) {
    console.error('[risk/assess]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to assess risk' }, { status: 500 })
  }
}
