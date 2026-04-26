import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import SummaryCard from './summary-card'
import ProfileSkills from './profile-skills'

async function getProfile(id: string) {
  const sb = getSupabaseAdmin()
  const { data: user } = await sb.from('users').select('*').eq('id', id).single()
  if (!user) return null

  const { data: skills } = await sb
    .from('skills_profile')
    .select('*')
    .eq('user_id', id)
    .order('confidence', { ascending: false })

  return { user, skills: skills ?? [] }
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProfile(id)
  if (!data) notFound()

  const { user, skills } = data

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <SummaryCard
        userId={id}
        displayName={user.display_name}
        region={user.region}
        countryCode={user.country_code}
      />
      <ProfileSkills id={id} skills={skills} />
    </div>
  )
}
