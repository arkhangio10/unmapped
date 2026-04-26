import RiskClient from './risk-client'

export default async function RiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RiskClient userId={id} />
}
