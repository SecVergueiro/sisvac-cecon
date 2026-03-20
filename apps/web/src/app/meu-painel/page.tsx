import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getMeuPerfil, getMeusSaldos, MinhasSolicitacoes } from '@/lib/queries/meu-painel'
import MeuPainelClient from './MeuPainelClient'

export default async function MeuPainelPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [perfil, saldos, solicitacoes] = await Promise.all([
    getMeuPerfil(session.user.id),
    getMeusSaldos(session.user.id),
    MinhasSolicitacoes(session.user.id),
  ])

  if (!perfil) redirect('/auth/login')

  return (
    <MeuPainelClient
      perfil={perfil}
      saldos={saldos}
      solicitacoes={solicitacoes}
    />
  )
}