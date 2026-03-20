export const dynamic = 'force-dynamic'

import { getSolicitacoesPendentes, getSolicitacoesHistorico } from '@/lib/queries/aprovacoes'
import AprovacoesClient from './AprovacoesClient'

export default async function AprovacoesPage() {
  const [pendentes, historico] = await Promise.all([
    getSolicitacoesPendentes(),
    getSolicitacoesHistorico(),
  ])

  return <AprovacoesClient pendentes={pendentes} historico={historico} />
}
