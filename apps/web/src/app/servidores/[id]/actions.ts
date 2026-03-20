'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function editarServidorAction(
  idMatricula: string,
  nome: string,
  cargo: string,
  setor: string
) {
  const supabase = createServerClient()

  // O Supabase Client não-admin que usamos tem row-level-security configurado
  // O Gestor RH tem acesso livre por causa dos Policies do Supabase.

  // 1. Descobrir qual Profile ID está vinculado a essa matrícula
  const { data: mat, error: errMat } = await supabase
    .from('matriculas')
    .select('profile_id')
    .eq('id', idMatricula)
    .single()

  if (errMat || !mat) {
    return { ok: false, error: 'Matrícula não encontrada no banco de dados.' }
  }

  // 2. Atualizar o nome do perfil
  const { error: errProf } = await supabase
    .from('profiles')
    .update({ nome })
    .eq('id', mat.profile_id)

  if (errProf) {
    return { ok: false, error: 'Não foi possível atualizar o nome do servidor.' }
  }

  // 3. Atualizar Cargo e Setor
  const { error: errUpdMat } = await supabase
    .from('matriculas')
    .update({ cargo, setor })
    .eq('id', idMatricula)

  if (errUpdMat) {
    return { ok: false, error: 'Não foi possível atualizar o cargo e setor.' }
  }

  revalidatePath('/servidores')
  revalidatePath(`/servidores/${idMatricula}`)
  revalidatePath('/dashboard')

  return { ok: true }
}
