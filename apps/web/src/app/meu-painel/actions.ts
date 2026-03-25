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

    // 3. Pegar Matricula Ativa (Lembrando que a coluna no banco é id_funcionario)
    const { data: mat } = await supabase.from('matriculas').select('id').eq('id_funcionario', func.id).eq('ativo', true).single()
    if (!mat) return { ok: false, error: 'Matrícula não encontrada.' }
    const idMatricula = mat.id

    // 4. Pegar Exercicio ID a partir da descricao (ex: "2026/2027")
    const { data: ex } = await supabase.from('exercicios').select('id').eq('descricao', String(dados.exercicio)).single()
    if (!ex) return { ok: false, error: 'Exercício não encontrado no banco de dados.' }

    // 5. Pegar Saldo ID
    const { data: saldo } = await supabase.from('saldos_ferias').select('id').eq('id_matricula', idMatricula).eq('id_exercicio', ex.id).single()
    if (!saldo) return { ok: false, error: 'Você não possui saldo cadastrado para este exercício.' }

    // 6. INSERT DIRETO NA TABELA (Adeus erro de função RPC e coluna inexistente!)
    const { error: insertErr } = await supabase.from('solicitacoes').insert({
      id_matricula: idMatricula,
      id_exercicio: ex.id,
      id_saldo_ferias: saldo.id,
      tipo_afastamento: dados.tipoAfastamento,
      tipo_fracionamento: dados.tipoFracionamento,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
      dias_solicitados: dados.diasSolicitados,
      observacoes: dados.observacoes || '',
      status: 'PENDENTE',
      solicitado_por: session.user.id
    })

    if (insertErr) {
      console.error('🚨 [Erro no Insert do Painel Servidor]:', insertErr.message)
      return { ok: false, error: insertErr.message }
    }

    // Limpa o cache para mostrar a nova solicitação na tabela imediatamente
    revalidatePath('/meu-painel')
    revalidatePath('/dashboard')
    revalidatePath('/aprovacoes')

    return { ok: true }
  } catch (error: any) {
    console.error('❌ [Erro Fatal na Action]:', error.message)
    return { ok: false, error: error.message }
  }
}