import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'
import { createServerClient } from '@/lib/supabase-server'

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, email, role, cpf')
    .eq('id', session.user.id)
    .single()

  return <ConfiguracoesClient user={profile || {}} />
}