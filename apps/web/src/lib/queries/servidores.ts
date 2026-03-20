import { createServerClient } from '@/lib/supabase-server'

export interface ServidorListItem {
  id: string
  nome: string
  matricula: string
  setor: string
  cargo: string
  saldo: number
  saldoLicenca: number
  situacao: 'Ativo' | 'Em descanso' | 'Risco perda' | 'Inativo'
  admissao: string
  emRisco: boolean
}

export interface ServidoresStats {
  total: number
  ativos: number
  emRisco: number
  emGozo: number
}

// ── Usa a view vw_servidores_busca — já faz todos os joins ────
export async function getServidores(): Promise<ServidorListItem[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_servidores_busca')
    .select('*')
    .order('nome')

  if (error) {
    console.error('[getServidores]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    id:           s.id_matricula,
    nome:         s.nome,
    matricula:    s.matricula,
    setor:        s.setor,
    cargo:        s.cargo,
    saldo:        s.saldo_ferias_total ?? 0,
    saldoLicenca: s.saldo_licenca_total ?? 0,
    emRisco:      s.em_risco_perda ?? false,
    admissao:     s.data_admissao,
    situacao:     s.em_risco_perda ? 'Risco perda' : 'Ativo',
  }))
}

export async function getServidoresStats(): Promise<ServidoresStats> {
  const servidores = await getServidores()
  return {
    total:   servidores.length,
    ativos:  servidores.filter(s => s.situacao === 'Ativo').length,
    emRisco: servidores.filter(s => s.emRisco).length,
    emGozo:  0, // virá da vw_solicitacoes_detalhadas quando conectarmos aprovações
  }
}

// ── Detalhes via view ─────────────────────────────────────────
export async function getServidorById(matriculaId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_servidores_busca')
    .select('*')
    .eq('id_matricula', matriculaId)
    .single()

  if (error) {
    console.error('[getServidorById]', error.message)
    return null
  }

  return data
}

export interface ServidorDetalhe {
  idMatricula: string
  nome: string
  cpf: string
  matricula: string
  cargo: string
  setor: string
  orgao: string
  vinculo: string
  admissao: string
  saldoFerias: number
  saldoLicenca: number
  emRisco: boolean
  situacao: string
}

export interface ServidorSolicitacao {
  id: string
  tipo: string
  periodo: string
  dias: number
  exercicio: string
  status: string
  criadoEm: string
  aprovadoPor: string | null
  negadoPor: string | null
}

const TIPO_MAP: Record<string, string> = {
  FERIAS_INTEGRAL:   'Férias integrais',
  FERIAS_FRACIONADA: 'Férias fracionadas',
  LICENCA_ESPECIAL:  'Licença especial',
}

const STATUS_MAP: Record<string, string> = {
  PENDENTE:   'Pendente',
  EM_ANALISE: 'Pendente',
  APROVADO:   'Aprovado',
  NEGADO:     'Reprovado',
  EM_GOZO:    'Em descanso',
  CANCELADO:  'Cancelado',
}

// ── Detalhe completo de um servidor ──────────────────────────
export async function getServidorDetalhe(matriculaId: string): Promise<ServidorDetalhe | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_servidores_busca')
    .select('*')
    .eq('id_matricula', matriculaId)
    .single()

  if (error || !data) {
    console.error('[getServidorDetalhe]', error?.message)
    return null
  }

  const situacao = !data.em_risco_perda ? 'Ativo' : 'Risco perda'

  return {
    idMatricula:  data.id_matricula,
    nome:         data.nome,
    cpf:          data.cpf,
    matricula:    data.matricula,
    cargo:        data.cargo,
    setor:        data.setor,
    orgao:        'FCECON',
    vinculo:      data.tipo_vinculo === 'ESTATUTARIO' ? 'Estatutário' : data.tipo_vinculo,
    admissao:     new Date(data.data_admissao).toLocaleDateString('pt-BR'),
    saldoFerias:  data.saldo_ferias_total ?? 0,
    saldoLicenca: data.saldo_licenca_total ?? 0,
    emRisco:      data.em_risco_perda ?? false,
    situacao,
  }
}

// ── Histórico de solicitações do servidor ─────────────────────
export async function getHistoricoServidor(matriculaId: string): Promise<ServidorSolicitacao[]> {
  const supabase = createServerClient()

  // busca a matrícula string para filtrar na view
  const { data: mat } = await supabase
    .from('matriculas')
    .select('matricula')
    .eq('id', matriculaId)
    .single()

  if (!mat?.matricula) return []

  const { data, error } = await supabase
    .from('vw_solicitacoes_detalhadas')
    .select('*')
    .eq('servidor_matricula', mat.matricula)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getHistoricoServidor]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    id:          s.id,
    tipo:        TIPO_MAP[s.tipo_afastamento] ?? s.tipo_afastamento,
    periodo:     `${new Date(s.data_inicio).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })} – ${new Date(s.data_fim).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}`,
    dias:        s.dias_solicitados,
    exercicio:   s.exercicio,
    status:      STATUS_MAP[s.status] ?? s.status,
    criadoEm:    new Date(s.created_at).toLocaleDateString('pt-BR'),
    aprovadoPor: s.aprovado_rh_nome,
    negadoPor:   s.negado_por_nome,
  }))
}