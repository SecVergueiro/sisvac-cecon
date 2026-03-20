export const dynamic = 'force-dynamic'

import { getServidoresParaFerias } from '@/lib/queries/ferias'
import FeriasClient from './FeriasClient'

export default async function FeriasPage({ searchParams }: { searchParams: Promise<{ servidor?: string }> }) {
  const params = await searchParams;
  const servidores = await getServidoresParaFerias()
  return <FeriasClient servidores={servidores} preSelectedId={params.servidor} />
}
