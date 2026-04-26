import AdminConfigClient from './admin-config-client'
import { getCountryConfig, getAllCountryConfigs } from '@/lib/config-loader'

export default async function AdminConfigPage() {
  const active = await getCountryConfig()
  const all = getAllCountryConfigs()
  return <AdminConfigClient activeConfig={active} allConfigs={all} />
}
