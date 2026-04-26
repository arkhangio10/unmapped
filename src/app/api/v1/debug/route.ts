export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface TestResult {
  test: string
  success: boolean
  detail?: unknown
}

export async function GET() {
  const tests: TestResult[] = []

  // 0. Inspect env
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(missing)'
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  tests.push({
    test: 'env_check',
    success: !!process.env.NEXT_PUBLIC_SUPABASE_URL && hasAnon && hasService,
    detail: {
      url_first_30_chars: url.slice(0, 30),
      url_last_15_chars: url.slice(-15),
      url_length: url.length,
      starts_with_https: url.startsWith('https://'),
      ends_with_supabase_co: url.endsWith('.supabase.co'),
      has_trailing_slash: url.endsWith('/'),
      has_anon_key: hasAnon,
      has_service_role_key: hasService,
    },
  })

  // 1. SELECT from country_configs (seeded with 2 rows)
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from('country_configs').select('country_code')
    tests.push({
      test: 'select_country_configs',
      success: !error,
      detail: error ? { error: error.message, code: error.code } : { rows: data?.length },
    })
  } catch (e: unknown) {
    tests.push({
      test: 'select_country_configs',
      success: false,
      detail: { exception: e instanceof Error ? e.message : String(e) },
    })
  }

  // 2. SELECT from users (should return 0 rows but no error)
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from('users').select('id')
    tests.push({
      test: 'select_users',
      success: !error,
      detail: error ? { error: error.message, code: error.code } : { rows: data?.length },
    })
  } catch (e: unknown) {
    tests.push({
      test: 'select_users',
      success: false,
      detail: { exception: e instanceof Error ? e.message : String(e) },
    })
  }

  // 3. INSERT a test user
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('users')
      .insert({ display_name: 'DebugTestUser', country_code: 'PER' })
      .select()
      .single()
    tests.push({
      test: 'insert_user',
      success: !error,
      detail: error ? { error: error.message, code: error.code, details: error.details } : { id: data?.id },
    })

    // Cleanup if it worked
    if (data?.id) {
      await sb.from('users').delete().eq('id', data.id)
    }
  } catch (e: unknown) {
    tests.push({
      test: 'insert_user',
      success: false,
      detail: { exception: e instanceof Error ? e.message : String(e) },
    })
  }

  return NextResponse.json({ tests }, { status: 200 })
}
