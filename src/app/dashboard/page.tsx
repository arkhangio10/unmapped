import DashboardClient from './dashboard-client'
import { getCountryConfig } from '@/lib/config-loader'

export default async function DashboardPage() {
  const config = await getCountryConfig()
  return <DashboardClient countryCode={config.country_code} />
}
