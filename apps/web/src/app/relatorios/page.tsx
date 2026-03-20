export const dynamic = 'force-dynamic'

import { getServidores } from '@/lib/queries/servidores'
import RelatoriosClient from './RelatoriosClient'

export default async function RelatoriosPage() {
  const servidores = await getServidores()
  
  return <RelatoriosClient servidores={servidores} />
}
