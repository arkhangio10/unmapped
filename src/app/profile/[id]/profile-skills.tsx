'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Reveal } from '@/components/reveal'
import { useT } from '@/lib/i18n'

const CATEGORY_COLOR: Record<string, string> = {
  mechanical: 'border-chart-1/30 bg-chart-1/10 text-chart-1',
  digital: 'border-chart-5/30 bg-chart-5/10 text-chart-5',
  language: 'border-primary/30 bg-primary/10 text-primary',
  soft: 'border-amber/40 bg-amber/10 text-amber-foreground',
  business: 'border-coral/30 bg-coral/10 text-coral',
  domain: 'border-border bg-muted text-muted-foreground',
}

interface Skill {
  id: number
  esco_skill_id: string
  skill_name: string
  skill_category: string | null
  confidence: number
  source: 'self-reported' | 'llm-inferred'
  human_readable_explanation: string | null
}

export default function ProfileSkills({ id, skills }: { id: string; skills: Skill[] }) {
  const t = useT()
  const [extraction, setExtraction] = useState<{ candidates: number; mapped: number } | null>(null)

  useEffect(() => {
    const stored = window.sessionStorage.getItem(`profile_extraction_${id}`)
    if (stored) {
      try {
        setExtraction(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
  }, [id])

  return (
    <>
      <Reveal delay={150}>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="font-serif-display text-2xl text-foreground">{t('profile.skills_title')}</h2>
            <p className="text-sm text-muted-foreground">
              {skills.length} {t('profile.skills_count')}
              {extraction && extraction.candidates > extraction.mapped && (
                <span className="ml-1 text-xs text-muted-foreground/70">
                  ({extraction.candidates} {t('profile.extraction_detail')})
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/profile/${id}/risk`}
            className="hover-lift inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t('profile.continue_risk')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-3">
        {skills.map((skill, i) => (
          <Reveal key={skill.id} delay={i * 60}>
            <div className="card-elevated p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-foreground capitalize">{skill.skill_name}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        CATEGORY_COLOR[skill.skill_category ?? 'domain'] ?? CATEGORY_COLOR.domain
                      }`}
                    >
                      {skill.skill_category}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        skill.source === 'self-reported'
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-amber/40 bg-amber/10 text-amber-foreground'
                      }`}
                    >
                      {skill.source === 'self-reported' ? t('profile.self_reported') : t('profile.ai_inferred')}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs font-data">ESCO {skill.esco_skill_id}</p>
                  {skill.human_readable_explanation && (
                    <p className="text-muted-foreground text-sm mt-1 italic">
                      &ldquo;{skill.human_readable_explanation}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right min-w-[88px]" title={t('profile.confidence_tooltip')}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    {t('profile.confidence_label')}
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {Math.round(skill.confidence * 100)}%
                  </p>
                  <Progress value={skill.confidence * 100} className="h-1.5 w-20" />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="card-elevated text-center py-12">
          <p className="text-muted-foreground">{t('profile.no_skills')}</p>
        </div>
      )}
    </>
  )
}
