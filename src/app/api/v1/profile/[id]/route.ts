export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: skills, error: skillError } = await supabaseAdmin
      .from('skills_profile')
      .select('*')
      .eq('user_id', id)
      .order('confidence', { ascending: false })

    if (skillError) throw skillError

    return NextResponse.json({ user, skills: skills ?? [] })
  } catch (err) {
    console.error('[profile/get]', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
