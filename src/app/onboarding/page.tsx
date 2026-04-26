import { getCountryConfig } from '@/lib/config-loader'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage() {
  const config = await getCountryConfig()
  return <OnboardingForm config={config} />
}
