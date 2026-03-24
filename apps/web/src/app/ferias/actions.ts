'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

export interface CriarSolicitacaoInput {
  idMatricula: string
  idExercicio: string | number // Aceita UUID ou ID numérico
  idSaldoFerias: string
  tipoAfastamento: 'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'
  tipoFracionamento: 'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'
  dataInicio: string
  dataFim: string
  diasSolicitados: number
  observacoes?: string
}

// Agora fazendo o INSERT direto de forma segura e profissional
export async function criarSolicitacaoAction(
  input: CriarSolicitacaoInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createServerClient()

  try {
    // 1. Precisamos da descrição do exercício (ex: "2026/2027") para salvar na solicitação
    const { data: ex } = await supabase
      .from('exercicios')
      .select('ano_inicial, ano_final, descricao')
      .eq('id', input.idExercicio)
      .single()

    const exercicioTexto = ex?.descricao || (ex ? `${ex.ano_inicial}/${ex.ano_final}` : '2026/2027')

    // 2. Fazemos o INSERT direto na tabela 'solicitacoes'
    const { data: novaSolicitacao, error: insertError } = await supabase
      .from('solicitacoes')
      .insert({
        id_matricula: input.idMatricula,
        tipo_afastamento: input.tipoAfastamento,
        tipo_fracionamento: input.tipoFracionamento,
        data_inicio: input.dataInicio,
        data_fim: input.dataFim,
        dias_solicitados: input.diasSolicitados,
        exercicio: exercicioTexto,
        observacoes: input.observacoes || '',
        status: 'PENDENTE' // Toda nova solicitação nasce pendente
      })
      .select('id')
      .single()

    if (insertError) throw new Error(insertError.message)

    // 3. Sucesso! Limpamos o cache das páginas para os dados novos aparecerem
    revalidatePath('/ferias')
    revalidatePath('/aprovacoes')
    revalidatePath('/dashboard')
    revalidatePath('/meu-painel')

    return { ok: true, id: novaSolicitacao.id }

  } catch (err: any) {
    console.error('🚨 [Server Action Error]:', err.message)
    return { ok: false, error: err.message ?? 'Erro ao processar sua solicitação' }
  }
}

// Leitura de saldos (já estava funcionando, mantida)
export async function getSaldosAction(idMatricula: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('saldos_ferias')
    .select('id, dias_disponiveis, em_risco, id_exercicio, exercicios(id, descricao)')
    .eq('id_matricula', idMatricula)
    .gt('dias_disponiveis', 0)
    .order('id_exercicio')

  if (error) {
    console.error('🚨 [getSaldosAction Error]:', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    idSaldo: s.id,
    idExercicio: s.exercicios?.id ?? s.id_exercicio,
    exercicio: s.exercicios?.descricao ?? '—',
    diasDisponiveis: s.dias_disponiveis,
    emRisco: s.em_risco,
  }))
}