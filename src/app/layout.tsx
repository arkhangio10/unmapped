import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { CountryProvider } from '@/lib/country-context'
import { getCountryConfig } from '@/lib/config-loader'
import { cookies } from 'next/headers'
import Navbar from '@/components/navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
})

export const metadata: Metadata = {
  title: 'UNMAPPED — Turn informal skills into economic identity',
  description:
    'UNMAPPED helps young people in low- and middle-income countries map informal experience to formal opportunities using ISCO/ESCO taxonomy and World Bank labor data.',
  openGraph: {
    title: 'UNMAPPED — Skills mapped, futures unlocked',
    description: 'Civic-tech infrastructure mapping informal youth skills to economic opportunities.',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeCountry = cookieStore.get('active_country')?.value ?? process.env.ACTIVE_COUNTRY ?? 'PER'
  const config = await getCountryConfig()

  return (
    <html lang={config.primary_language}>
      <body className={`${inter.variable} ${instrumentSerif.variable} antialiased min-h-screen`}>
        <CountryProvider initialCountryCode={activeCountry} initialConfig={config}>
          <Navbar />
          <main>{children}</main>
        </CountryProvider>
      </body>
    </html>
  )
}
