import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { CountryConfig } from '@/types'
import { cookies } from 'next/headers'

const SUPPORTED_COUNTRIES = ['PER', 'GHA']
const DEFAULT_COUNTRY = 'PER'

const CODE_TO_FILENAME: Record<string, string> = {
  PER: 'peru.yaml',
  GHA: 'ghana.yaml',
}

function loadConfig(countryCode: string): CountryConfig {
  const filename = CODE_TO_FILENAME[countryCode] ?? CODE_TO_FILENAME[DEFAULT_COUNTRY]
  const filePath = path.join(process.cwd(), 'config', 'countries', filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return yaml.load(raw) as CountryConfig
}

// Cache loaded configs in module scope
const configCache: Record<string, CountryConfig> = {}

export function getConfigByCode(countryCode: string): CountryConfig {
  const code = SUPPORTED_COUNTRIES.includes(countryCode) ? countryCode : DEFAULT_COUNTRY
  if (!configCache[code]) {
    configCache[code] = loadConfig(code)
  }
  return configCache[code]
}

export async function getCountryConfig(): Promise<CountryConfig> {
  const cookieStore = await cookies()
  const activeCountry = cookieStore.get('active_country')?.value ?? process.env.ACTIVE_COUNTRY ?? DEFAULT_COUNTRY
  return getConfigByCode(activeCountry)
}

export function getActiveCountryFromHeader(headerCookie?: string): string {
  if (!headerCookie) return DEFAULT_COUNTRY
  const match = headerCookie.match(/active_country=([A-Z]{3})/)
  return match ? match[1] : DEFAULT_COUNTRY
}

export function getAllCountryConfigs(): CountryConfig[] {
  return SUPPORTED_COUNTRIES.map(code => getConfigByCode(code))
}
