import { createServerClient } from '@/lib/supabase-server'

export interface ServidorParaFerias {
  idMatricula: string
  matricula: string
  nome: string
  setor: string
  cargo: string
}

export interface SaldoDisponivel {
  idSaldo: string
  idMatricula: string
  exercicio: string
  idExercicio: number
  diasDisponiveis: number
  emRisco: boolean
}

// ── Lista servidores para o autocomplete ──────────────────────
export async function getServidoresParaFerias(): Promise<ServidorParaFerias[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_servidores_busca')
    .select('id_matricula, matricula, nome, setor, cargo')
    .order('nome')

  if (error) {
    console.error('[getServidoresParaFerias]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    idMatricula: s.id_matricula,
    matricula:   s.matricula,
    nome:        s.nome,
    setor:       s.setor,
    cargo:       s.cargo,
  }))
}

// ── Saldos disponíveis de um servidor ────────────────────────
export async function getSaldosDoServidor(idMatricula: string): Promise<SaldoDisponivel[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('saldos_ferias')
    .select('id, id_matricula, dias_disponiveis, em_risco, id_exercicio, exercicios(descricao)')
    .eq('id_matricula', idMatricula)
    .gt('dias_disponiveis', 0)
    .order('id_exercicio')

  if (error) {
    console.error('[getSaldosDoServidor]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    idSaldo:         s.id,
    idMatricula:     s.id_matricula,
    idExercicio:     s.id_exercicio,
    exercicio:       s.exercicios?.descricao ?? '—',
    diasDisponiveis: s.dias_disponiveis,
    emRisco:         s.em_risco,
  }))
}