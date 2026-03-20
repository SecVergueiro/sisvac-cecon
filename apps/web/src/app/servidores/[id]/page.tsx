export const dynamic = 'force-dynamic'

import { getServidorDetalhe, getHistoricoServidor } from '@/lib/queries/servidores'
import { notFound } from 'next/navigation'
import ServidorDetalheClient from './ServidorDetalheClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ServidorDetalhePage({ params }: Props) {
  const { id } = await params;

  const [servidor, historico] = await Promise.all([
    getServidorDetalhe(id),
    getHistoricoServidor(id),
  ])

  if (!servidor) notFound()

  return <ServidorDetalheClient servidor={servidor} historico={historico} idServidor={id} />
}
