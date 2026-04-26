export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getConfigByCode } from '@/lib/config-loader'
import { matchOpportunities } from '@/lib/opportunities/matcher'

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
    const opportunities = await matchOpportunities(user_id, country)

    if (opportunities.length > 0) {
      const rows = opportunities.map(o => ({ user_id, ...o }))
      const { error: insertError } = await supabaseAdmin.from('opportunities').insert(rows)
      if (insertError) console.error('[opportunities/match] insert error:', insertError)
    }

    return NextResponse.json({ opportunities })
  } catch (err) {
    console.error('[opportunities/match]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to match opportunities' }, { status: 500 })
  }
}
