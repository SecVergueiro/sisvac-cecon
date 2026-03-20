export const dynamic = 'force-dynamic'

import { getDashboardKpis, getAprovacoesRecentes, getServidoresEmDescanso } from '@/lib/queries/dashboard'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const [kpis, aprovacoes, emGozo] = await Promise.all([
    getDashboardKpis(),
    getAprovacoesRecentes(),
    getServidoresEmDescanso(),
  ])

  return <DashboardClient kpis={kpis} aprovacoes={aprovacoes} emGozo={emGozo} />
}