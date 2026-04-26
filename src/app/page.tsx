'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Target, ShieldCheck, Globe } from 'lucide-react'
import { Reveal, CharReveal } from '@/components/reveal'
import { useT } from '@/lib/i18n'

export default function LandingPage() {
  const t = useT()

  const FEATURES = [
    { icon: Sparkles, title: t('landing.module_1_title'), desc: t('landing.module_1_desc'), tag: 'ESCO v1.2.0' },
    { icon: ShieldCheck, title: t('landing.module_2_title'), desc: t('landing.module_2_desc'), tag: 'Frey-Osborne 2013' },
    { icon: Target, title: t('landing.module_3_title'), desc: t('landing.module_3_desc'), tag: 'ILOSTAT · WDI' },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground">
      <section className="relative isolate mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="aurora" aria-hidden="true">
          <div className="aurora__blob aurora__blob--1" />
          <div className="aurora__blob aurora__blob--2" />
          <div className="aurora__blob aurora__blob--3" />
          <div className="aurora__grain" />
        </div>

        <div className="relative z-10">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('landing.badge')}
            </span>
          </Reveal>

          <h1 className="mt-6 font-serif-display text-5xl sm:text-6xl md:text-7xl leading-[1.05] text-foreground max-w-4xl mx-auto">
            <CharReveal text={t('landing.hero_line1')} />
            <br />
            <em className="italic text-primary">
              <CharReveal text={t('landing.hero_line2')} startDelay={500} />
            </em>
          </h1>

          <Reveal delay={900}>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              {t('landing.hero_description')}
            </p>
          </Reveal>

          <Reveal delay={1050}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/onboarding"
                className="hover-lift inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {t('landing.cta_primary')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="hover-lift inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:border-primary"
              >
                {t('landing.cta_secondary')}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={1200}>
            <p className="mt-12 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">🇵🇪 {t('landing.personas_label')}</span>
              <span className="mx-3 text-border">·</span>
              <span className="inline-flex items-center gap-1.5">🇬🇭 {t('landing.personas_label_2')}</span>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-serif-display text-3xl sm:text-4xl text-foreground">{t('landing.modules_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('landing.modules_subtitle')}</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="card-elevated p-6 h-full">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground font-data">
                  {f.tag}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            {t('landing.infra_label')}
          </p>
          <h3 className="font-serif-display text-3xl text-foreground mb-4">{t('landing.infra_title')}</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">{t('landing.infra_desc')}</p>
          <Link
            href="/admin/config"
            className="hover-lift inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary"
          >
            <Globe className="h-4 w-4" /> {t('landing.infra_cta')}
          </Link>
        </Reveal>
      </section>

      <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-t border-border text-center text-xs text-muted-foreground">
        {t('landing.footer')}
      </footer>
    </div>
  )
}
