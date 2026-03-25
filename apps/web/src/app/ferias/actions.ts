'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth' // <-- Novo import de autenticação

export interface CriarSolicitacaoInput {
  idMatricula: string
  idExercicio: string | number
  idSaldoFerias: string
  tipoAfastamento: 'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'
  tipoFracionamento: 'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'
  dataInicio: string
  dataFim: string
  diasSolicitados: number
  observacoes?: string
}

export async function criarSolicitacaoAction(
  input: CriarSolicitacaoInput
): Promise<{ ok: boolean; id?: string; error?: string }> {

  // Pega quem está logado fazendo a solicitação
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Acesso negado. Usuário não logado.' }

  const supabase = createServerClient()
  console.log('🚀 [Server Action] Executando INSERT direto para a matrícula:', input.idMatricula)

  try {
    const { data: nova, error: insertError } = await supabase
      .from('solicitacoes')
      .insert({
        id_matricula: input.idMatricula,
        id_exercicio: input.idExercicio,
        id_saldo_ferias: input.idSaldoFerias,
        tipo_afastamento: input.tipoAfastamento,
        tipo_fracionamento: input.tipoFracionamento,
        data_inicio: input.dataInicio,
        data_fim: input.dataFim,
        dias_solicitados: input.diasSolicitados,
        observacoes: input.observacoes || '',
        status: 'PENDENTE',
        solicitado_por: session.user.id // <-- MÁGICA AQUI: Registra quem pediu!
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('🚨 [Supabase Insert Error]:', insertError)
      throw new Error(insertError.message)
    }

    revalidatePath('/ferias')
    revalidatePath('/dashboard')
    revalidatePath('/meu-painel')

    return { ok: true, id: nova.id }

  } catch (err: any) {
    console.error('❌ [Erro na Action]:', err.message)
    return { ok: false, error: err.message }
  }
}

export async function getSaldosAction(idMatricula: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('saldos_ferias')
    .select('id, dias_disponiveis, em_risco, id_exercicio, exercicios(id, descricao)')
    .eq('id_matricula', idMatricula)
    .gt('dias_disponiveis', 0)
    .order('id_exercicio')

  if (error) return []

  return (data ?? []).map((s: any) => ({
    idSaldo: s.id,
    idExercicio: s.exercicios?.id ?? s.id_exercicio,
    exercicio: s.exercicios?.descricao ?? '—',
    diasDisponiveis: s.dias_disponiveis,
    emRisco: s.em_risco,
  }))
}