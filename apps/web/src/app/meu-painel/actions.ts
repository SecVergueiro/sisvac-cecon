'use server'

import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function solicitarFeriasServidorAction(dados: {
  exercicio: string,
  tipoAfastamento: string,
  tipoFracionamento: string,
  dataInicio: string,
  dataFim: string,
  diasSolicitados: number,
  observacoes?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { ok: false, error: 'Não autorizado.' }
    const supabase = createServerClient()
    
    // 1. Pegar CPF pelo Profile
    const { data: profile } = await supabase.from('profiles').select('cpf').eq('id', session.user.id).single()
    if (!profile) return { ok: false, error: 'Perfil não encontrado.' }
    
    // 2. Pegar Funcionario
    const { data: func } = await supabase.from('funcionarios').select('id').eq('cpf', profile.cpf).single()
    if (!func) return { ok: false, error: 'Funcionário não encontrado.' }
    
    // 3. Pegar Matricula Ativa
    const { data: mat } = await supabase.from('matriculas').select('id').eq('id_funcionario', func.id).eq('ativo', true).single()
    if (!mat) return { ok: false, error: 'Matrícula não encontrada.' }
    const idMatricula = mat.id

    // 4. Pegar Exercicio ID a partir da descricao (ex: "2024")
    const { data: ex } = await supabase.from('exercicios').select('id').eq('descricao', String(dados.exercicio)).single()
    if (!ex) return { ok: false, error: 'Exercício não encontrado no banco de dados.' }

    // 5. Pegar Saldo ID
    const { data: saldo } = await supabase.from('saldos_ferias').select('id').eq('id_matricula', idMatricula).eq('id_exercicio', ex.id).single()
    if (!saldo) return { ok: false, error: 'Você não possui saldo cadastrado para este exercício.' }

    // 6. Inserir na RPC
    const payload = {
      p_id_matricula: idMatricula,
      p_id_exercicio: ex.id,
      p_id_saldo_ferias: saldo.id,
      p_tipo_afastamento: dados.tipoAfastamento,
      p_tipo_fracionamento: dados.tipoFracionamento,
      p_data_inicio: dados.dataInicio,
      p_data_fim: dados.dataFim,
      p_dias_solicitados: dados.diasSolicitados,
      p_observacoes: dados.observacoes || null
    }

    const { error: rpcErr } = await supabase.rpc('criar_solicitacao_ferias', payload)
    if (rpcErr) return { ok: false, error: rpcErr.message }
    
    revalidatePath('/meu-painel')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}
