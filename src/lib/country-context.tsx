'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CountryConfig } from '@/types'

interface CountryContextValue {
  country: CountryConfig | null
  countryCode: string
  switchCountry: (code: string) => Promise<void>
}

const CountryContext = createContext<CountryContextValue>({
  country: null,
  countryCode: 'PER',
  switchCountry: async () => {},
})

export function CountryProvider({
  children,
  initialCountryCode,
  initialConfig,
}: {
  children: React.ReactNode
  initialCountryCode: string
  initialConfig: CountryConfig
}) {
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [country, setCountry] = useState<CountryConfig>(initialConfig)

  const switchCountry = useCallback(async (code: string) => {
    const res = await fetch('/api/v1/config/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_code: code }),
    })
    if (res.ok) {
      const data = await res.json()
      setCountryCode(code)
      setCountry(data.config)
    }
  }, [])

  return (
    <CountryContext.Provider value={{ country, countryCode, switchCountry }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry() {
  return useContext(CountryContext)
}
