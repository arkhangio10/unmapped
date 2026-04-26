export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getConfigByCode } from '@/lib/config-loader'

export async function GET(req: NextRequest, { params }: { params: Promise<{ country_code: string }> }) {
  const { country_code } = await params
  try {
    const config = getConfigByCode(country_code.toUpperCase())
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: 'Country not found' }, { status: 404 })
  }
}
