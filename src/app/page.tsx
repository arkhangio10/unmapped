import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCountryConfig } from '@/lib/config-loader'

export default async function LandingPage() {
  await getCountryConfig()

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <Badge className="mb-6 bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/10">
            Hack-Nation × MIT × World Bank · 2026
          </Badge>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
            Your skills are real.
          </h1>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-orange-400">
            Now they&apos;re visible.
          </h2>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            UNMAPPED is open infrastructure that turns lived experience into a portable economic
            identity — mapped to international standards, readable by any employer, government,
            or training provider in any country.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg px-8 py-6 rounded-xl w-full sm:w-auto">
                Try the demo →
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white text-lg px-8 py-6 rounded-xl w-full sm:w-auto"
              >
                Policymaker dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>🇵🇪</span>
              <span>Diego, 21, Cusco — motorcycle mechanic, Facebook seller</span>
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <span>🇬🇭</span>
              <span>Amara, 22, Accra — phone repair, self-taught Python</span>
            </span>
          </div>
        </div>
      </section>

      {/* Three modules */}
      <section className="px-4 py-16 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-2xl font-bold mb-2 text-white">Three modules. One portable identity.</h3>
          <p className="text-center text-slate-500 mb-10">Not an app. Infrastructure that any government or employer can fork.</p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">🧬</div>
                <h4 className="font-bold text-white mb-2">Skills Signal Engine</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Describe yourself in plain language. We extract every skill — mechanical, digital,
                  language, business — and map them to the ESCO international taxonomy with ISCO codes.
                </p>
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">ESCO v1.2.0</Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">ISCO-08</Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">Claude AI</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">🛡️</div>
                <h4 className="font-bold text-white mb-2">AI Readiness Lens</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automation risk calibrated for your local economy — not the U.S. baseline.
                  Uses Frey-Osborne scores with country-specific multipliers from ILO task indices.
                </p>
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">Frey-Osborne 2013</Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">ILO calibration</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="font-bold text-white mb-2">Opportunity Matching</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Real jobs, real wages from ILOSTAT. Real employment growth from World Bank WDI.
                  Scored by skill match × wage × growth — not generic career advice.
                </p>
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">ILOSTAT 2023</Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">World Bank WDI</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Config switcher callout */}
      <section className="px-4 py-12 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-3 font-medium">The infrastructure play</p>
          <h3 className="text-2xl font-bold text-white mb-4">One config file. Any country.</h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            Switch the entire app — language, currency, calibration, data sources, demo persona —
            between Peru and Ghana with a single click. No redeploy. No code change.
            Any government can fork this repo and configure it for their own country today.
          </p>
          <Link href="/admin/config">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:border-orange-400 hover:text-orange-400">
              See the live config switcher →
            </Button>
          </Link>
        </div>
      </section>

      <footer className="px-4 py-6 border-t border-slate-800 text-center text-xs text-slate-600">
        Real public data only · ESCO v1.2.0 · Frey-Osborne 2013 · ILOSTAT · World Bank WDI 2024 · MIT License
      </footer>
    </div>
  )
}
