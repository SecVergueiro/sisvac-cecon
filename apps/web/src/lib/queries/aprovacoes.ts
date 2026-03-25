import { createServerClient } from '@/lib/supabase-server'

export interface SolicitacaoPendente {
  id: string
  nome: string
  matricula: string
  setor: string
  cargo: string
  tipo: string
  fracionamento: string
  periodo: string
  dias: number
  exercicio: string
  criadoEm: string
  solicitadoPor: string
  observacoes?: string
}

export interface SolicitacaoHistorico {
  id: string
  nome: string
  matricula: string
  periodo: string
  dias: number
  status: string
  aprovadoPor: string | null
  negadoPor: string | null
  data: string
  setor?: string
  tipo?: string
  fracionamento?: string
  observacoes?: string
}

const TIPO_MAP: Record<string, string> = {
  FERIAS_INTEGRAL: 'Férias integrais',
  FERIAS_FRACIONADA: 'Férias fracionadas',
  LICENCA_ESPECIAL: 'Licença especial',
}

const FRACAO_MAP: Record<string, string> = {
  INTEGRAL: 'Integral',
  QUINZE_QUINZE: '15 + 15',
  DEZ_VINTE: '10 + 20',
  DEZ_DEZ_DEZ: '10 + 10 + 10',
}

function formatPeriodo(inicio: string, fim: string) {
  const i = new Date(inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const f = new Date(fim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  return `${i} – ${f}`
}

// ── Pendentes (PENDENTE + EM_ANALISE) ─────────────────────────
export async function getSolicitacoesPendentes(): Promise<SolicitacaoPendente[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_solicitacoes_detalhadas')
    .select('*')
    .in('status', ['PENDENTE', 'EM_ANALISE'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getSolicitacoesPendentes]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    id: s.id,
    nome: s.servidor_nome,
    matricula: s.servidor_matricula,
    setor: s.setor_nome,
    cargo: s.cargo_nome,
    tipo: TIPO_MAP[s.tipo_afastamento] ?? s.tipo_afastamento,
    fracionamento: FRACAO_MAP[s.tipo_fracionamento] ?? s.tipo_fracionamento,
    periodo: formatPeriodo(s.data_inicio, s.data_fim),
    dias: s.dias_solicitados,
    exercicio: s.exercicio,
    criadoEm: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    solicitadoPor: s.solicitado_por_nome,
    observacoes: s.observacoes,
  }))
}

// ── Histórico (aprovadas, negadas, em descanso, concluídas) ───────
export async function getSolicitacoesHistorico(): Promise<SolicitacaoHistorico[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_solicitacoes_detalhadas')
    .select('*')
    .in('status', ['APROVADO', 'NEGADO', 'EM_GOZO', 'CANCELADO'])
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[getSolicitacoesHistorico]', error.message)
    return []
  }

  const STATUS_MAP: Record<string, string> = {
    APROVADO: 'Aprovado',
    NEGADO: 'Reprovado',
    EM_GOZO: 'Em descanso',
    CANCELADO: 'Cancelado',
  }

  return (data ?? []).map((s: any) => ({
    id: s.id,
    nome: s.servidor_nome,
    matricula: s.servidor_matricula,
    periodo: formatPeriodo(s.data_inicio, s.data_fim),
    dias: s.dias_solicitados,
    status: STATUS_MAP[s.status] ?? s.status,
    aprovadoPor: s.aprovado_rh_nome,
    negadoPor: s.negado_por_nome,
    data: new Date(s.updated_at).toLocaleDateString('pt-BR'),
    setor: s.setor_nome,
    tipo: TIPO_MAP[s.tipo_afastamento] ?? s.tipo_afastamento,
    fracionamento: FRACAO_MAP[s.tipo_fracionamento] ?? s.tipo_fracionamento,
    observacoes: s.observacoes,
  }))
}

// ── Aprovar solicitação ───────────────────────────────────────
export async function aprovarSolicitacao(id: string, aprovadoPorId: string): Promise<boolean> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('solicitacoes')
    .update({
      status: 'APROVADO',
      aprovado_rh_por: aprovadoPorId,
      aprovado_rh_em: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[aprovarSolicitacao]', error.message)
    return false
  }

  return true
}

// ── Negar solicitação ─────────────────────────────────────────
export async function negarSolicitacao(id: string, negadoPorId: string, justificativa?: string): Promise<boolean> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('solicitacoes')
    .update({
      status: 'NEGADO',
      negado_por: negadoPorId,
      negado_em: new Date().toISOString(),
      justificativa_negacao: justificativa ?? null,
    })
    .eq('id', id)

  if (error) {
    console.error('[negarSolicitacao]', error.message)
    return false
  }

  return true
}