import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSupabaseAdmin } from '@/lib/supabase'
import SummaryCard from './summary-card'

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

const CATEGORY_COLOR: Record<string, string> = {
  mechanical: 'bg-blue-900/50 text-blue-300 border-blue-700',
  digital: 'bg-purple-900/50 text-purple-300 border-purple-700',
  language: 'bg-green-900/50 text-green-300 border-green-700',
  soft: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  business: 'bg-orange-900/50 text-orange-300 border-orange-700',
  domain: 'bg-slate-800 text-slate-300 border-slate-600',
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProfile(id)
  if (!data) notFound()

  const { user, skills } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SummaryCard
        userId={id}
        displayName={user.display_name}
        region={user.region}
        countryCode={user.country_code}
      />

      {/* Skills grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Your skill profile
          <span className="ml-2 text-slate-500 text-base font-normal">
            ({skills.length} skills identified)
          </span>
        </h2>
        <Link href={`/profile/${id}/risk`}>
          <Button className="bg-orange-500 hover:bg-orange-400 text-white font-semibold">
            Continue to AI Risk →
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {skills.map((skill: any) => (
          <Card key={skill.id} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-white capitalize">{skill.skill_name}</h3>
                    <Badge
                      variant="outline"
                      className={`text-xs ${CATEGORY_COLOR[skill.skill_category] ?? CATEGORY_COLOR.domain}`}
                    >
                      {skill.skill_category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        skill.source === 'self-reported'
                          ? 'bg-green-900/40 text-green-400 border-green-700 text-xs'
                          : 'bg-blue-900/40 text-blue-400 border-blue-700 text-xs'
                      }
                    >
                      {skill.source === 'self-reported' ? '✓ Self-reported' : '◆ AI-inferred'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">ESCO {skill.esco_skill_id}</p>
                  {skill.human_readable_explanation && (
                    <p className="text-slate-400 text-sm mt-1 italic">
                      &ldquo;{skill.human_readable_explanation}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-medium text-white mb-1">
                    {Math.round(skill.confidence * 100)}%
                  </p>
                  <Progress
                    value={skill.confidence * 100}
                    className="h-1.5 w-20 bg-slate-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {skills.length === 0 && (
        <Card className="bg-slate-900 border-slate-800 text-center py-12">
          <CardContent>
            <p className="text-slate-400">No skills extracted. Try providing more detail in your description.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
