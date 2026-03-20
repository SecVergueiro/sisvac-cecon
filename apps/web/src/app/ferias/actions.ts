'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'
import { apiCriarSolicitacao } from '@/lib/api-client'

export interface CriarSolicitacaoInput {
  idMatricula:       string
  idExercicio:       number
  idSaldoFerias:     string
  tipoAfastamento:   'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'
  tipoFracionamento: 'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'
  dataInicio:        string
  dataFim:           string
  diasSolicitados:   number
  observacoes?:      string
}

// Mutations complexas → NestJS (valida Lei 1.762/1986, audit log)
export async function criarSolicitacaoAction(
  input: CriarSolicitacaoInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const result: any = await apiCriarSolicitacao(input)
    revalidatePath('/ferias')
    revalidatePath('/aprovacoes')
    revalidatePath('/dashboard')
    return { ok: true, id: result.id }
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Erro ao criar solicitação' }
  }
}

// Leitura simples → Supabase direto (sem necessidade do NestJS)
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
    idSaldo:         s.id,
    idExercicio:     s.exercicios?.id ?? s.id_exercicio,
    exercicio:       s.exercicios?.descricao ?? '—',
    diasDisponiveis: s.dias_disponiveis,
    emRisco:         s.em_risco,
  }))
}