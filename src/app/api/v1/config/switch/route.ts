export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigByCode } from '@/lib/config-loader'
import { z } from 'zod'

const schema = z.object({ country_code: z.enum(['PER', 'GHA']) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { country_code } = schema.parse(body)
    const config = getConfigByCode(country_code)

    const res = NextResponse.json({ config, country_code })
    res.cookies.set('active_country', country_code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Invalid country code' }, { status: 400 })
  }
}
