'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

export type TipoVinculo = 'ESTATUTARIO' | 'COMISSIONADO' | 'ESTATUTARIO_COMISSIONADO'

export interface CadastrarServidorInput {
  nome:         string
  cpf:          string
  matricula:    string
  idCargo:      number
  idSetor:      number
  tipoVinculo:  TipoVinculo
  dataAdmissao: string
}

export async function cadastrarServidorAction(
  input: CadastrarServidorInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createServerClient()

  // Verificar CPF duplicado
  const { data: cpfExiste } = await supabase
    .from('funcionarios')
    .select('id')
    .eq('cpf', input.cpf)
    .single()

  if (cpfExiste) {
    return { ok: false, error: 'Já existe um funcionário cadastrado com este CPF.' }
  }

  // Verificar matrícula duplicada
  const { data: matExiste } = await supabase
    .from('matriculas')
    .select('id')
    .eq('matricula', input.matricula)
    .single()

  if (matExiste) {
    return { ok: false, error: 'Esta matrícula já está em uso.' }
  }

  // Chamar a função do banco
  const { data, error } = await supabase.rpc('fn_cadastrar_servidor', {
    p_nome:          input.nome,
    p_cpf:           input.cpf,
    p_matricula:     input.matricula,
    p_id_cargo:      input.idCargo,
    p_id_setor:      input.idSetor,
    p_tipo_vinculo:  input.tipoVinculo,
    p_data_admissao: input.dataAdmissao,
  })

  if (error) {
    console.error('[cadastrarServidorAction]', error.message)
    if (error.message.includes('cpf'))       return { ok: false, error: 'CPF inválido ou já cadastrado.' }
    if (error.message.includes('matricula')) return { ok: false, error: 'Matrícula inválida ou já em uso.' }
    if (error.message.includes('setor'))     return { ok: false, error: 'Setor não encontrado.' }
    if (error.message.includes('cargo'))     return { ok: false, error: 'Cargo não encontrado.' }
    return { ok: false, error: 'Erro ao cadastrar. Verifique os dados e tente novamente.' }
  }

  revalidatePath('/servidores')
  revalidatePath('/dashboard')

  return { ok: true, id: data }
}

export async function getCargosESetores() {
  const supabase = createServerClient()

  const [cargos, setores] = await Promise.all([
    supabase.from('cargos').select('id, nome').order('nome'),
    supabase.from('setores').select('id, nome').eq('ativo', true).order('nome'),
  ])

  return {
    cargos:  (cargos.data  ?? []) as { id: number; nome: string }[],
    setores: (setores.data ?? []) as { id: number; nome: string }[],
  }
}