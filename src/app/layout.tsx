import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { CountryProvider } from '@/lib/country-context'
import { getCountryConfig } from '@/lib/config-loader'
import { cookies } from 'next/headers'
import Navbar from '@/components/navbar'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UNMAPPED — Informal Skills to Economic Opportunity',
  description:
    'Open infrastructure that maps a young person\'s real skills to real economic opportunities in low- and middle-income countries.',
  openGraph: {
    title: 'UNMAPPED',
    description: 'Your skills are real. Now they\'re visible.',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeCountry = cookieStore.get('active_country')?.value ?? process.env.ACTIVE_COUNTRY ?? 'PER'
  const config = await getCountryConfig()

  return (
    <html lang={config.primary_language}>
      <body className={`${geist.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen`}>
        <CountryProvider initialCountryCode={activeCountry} initialConfig={config}>
          <Navbar />
          <main>{children}</main>
        </CountryProvider>
      </body>
    </html>
  )
}
