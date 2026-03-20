import { createServerClient } from '@/lib/supabase-server'

export interface MeuPerfil {
  nome: string
  cpf: string
  email: string
  matricula: string
  cargo: string
  setor: string
  orgao: string
  vinculo: string
  admissao: string
  temLicenca: boolean
  licencaDias: number
}

export interface MeuSaldo {
  exercicio: string
  diasDisponiveis: number
  diasUtilizados: number
  diasDireito: number
  emRisco: boolean
  vencimento: string | null
}

export interface MinhaSolicitacao {
  id: string
  tipo: string
  fracionamento: string
  periodo: string
  dias: number
  exercicio: string
  status: string
  criadoEm: string
  aprovadoPor: string | null
  negadoPor: string | null
  justificativa: string | null
}

const TIPO_MAP: Record<string, string> = {
  FERIAS_INTEGRAL:   'Férias integrais',
  FERIAS_FRACIONADA: 'Férias fracionadas',
  LICENCA_ESPECIAL:  'Licença especial',
}

const FRACAO_MAP: Record<string, string> = {
  INTEGRAL:      'Integral',
  QUINZE_QUINZE: '15 + 15',
  DEZ_VINTE:     '10 + 20',
  DEZ_DEZ_DEZ:   '10 + 10 + 10',
}

const STATUS_MAP: Record<string, string> = {
  PENDENTE:   'Pendente',
  EM_ANALISE: 'Pendente',
  APROVADO:   'Aprovado',
  NEGADO:     'Reprovado',
  EM_GOZO:    'Em descanso',
  CANCELADO:  'Cancelado',
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
}

function formatPeriodo(inicio: string, fim: string) {
  const i = new Date(inicio).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
  const f = new Date(fim).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
  return `${i} – ${f}`
}

// ── Busca a matrícula do servidor pelo profile_id ─────────────
async function getMatriculaIdByProfileId(profileId: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf')
    .eq('id', profileId)
    .single()

  if (!profile?.cpf) return null

  const { data: funcionario } = await supabase
    .from('funcionarios')
    .select('id')
    .eq('cpf', profile.cpf)
    .single()

  if (!funcionario?.id) return null

  const { data: matricula } = await supabase
    .from('matriculas')
    .select('id')
    .eq('id_funcionario', funcionario.id)
    .eq('ativo', true)
    .single()

  return matricula?.id ?? null
}

// ── Perfil + dados funcionais ─────────────────────────────────
export async function getMeuPerfil(profileId: string): Promise<MeuPerfil | null> {
  const supabase = createServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, cpf, email')
    .eq('id', profileId)
    .single()

  if (!profile) return null

  const { data: servidor } = await supabase
    .from('vw_servidores_busca')
    .select('*')
    .eq('cpf', profile.cpf)
    .single()

  if (!servidor) return null

  return {
    nome:       profile.nome,
    cpf:        profile.cpf,
    email:      profile.email,
    matricula:  servidor.matricula,
    cargo:      servidor.cargo,
    setor:      servidor.setor,
    orgao:      'FCECON',
    vinculo:    servidor.tipo_vinculo === 'ESTATUTARIO' ? 'Estatutário' : servidor.tipo_vinculo,
    admissao:   new Date(servidor.data_admissao).toLocaleDateString('pt-BR'),
    temLicenca: (servidor.saldo_licenca_total ?? 0) > 0,
    licencaDias: servidor.saldo_licenca_total ?? 0,
  }
}

// ── Saldos de férias ──────────────────────────────────────────
export async function getMeusSaldos(profileId: string): Promise<MeuSaldo[]> {
  const supabase = createServerClient()
  const matriculaId = await getMatriculaIdByProfileId(profileId)
  if (!matriculaId) return []

  const { data, error } = await supabase
    .from('saldos_ferias')
    .select('dias_disponiveis, dias_utilizados, dias_direito, em_risco, vencimento, exercicios(descricao)')
    .eq('id_matricula', matriculaId)
    .order('id_exercicio', { ascending: false })

  if (error) {
    console.error('[getMeusSaldos]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    exercicio:       s.exercicios?.descricao ?? '—',
    diasDisponiveis: s.dias_disponiveis,
    diasUtilizados:  s.dias_utilizados,
    diasDireito:     s.dias_direito,
    emRisco:         s.em_risco,
    vencimento:      s.vencimento ? new Date(s.vencimento).toLocaleDateString('pt-BR') : null,
  }))
}

// ── Histórico de solicitações ─────────────────────────────────
export async function MinhasSolicitacoes(profileId: string): Promise<MinhaSolicitacao[]> {
  const supabase = createServerClient()
  const matriculaId = await getMatriculaIdByProfileId(profileId)
  if (!matriculaId) return []

  const { data, error } = await supabase
    .from('vw_solicitacoes_detalhadas')
    .select('*')
    .eq('servidor_matricula', await getMatriculaByMatriculaId(matriculaId))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[MinhasSolicitacoes]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    id:           s.id,
    tipo:         TIPO_MAP[s.tipo_afastamento] ?? s.tipo_afastamento,
    fracionamento: FRACAO_MAP[s.tipo_fracionamento] ?? s.tipo_fracionamento,
    periodo:      formatPeriodo(s.data_inicio, s.data_fim),
    dias:         s.dias_solicitados,
    exercicio:    s.exercicio,
    status:       STATUS_MAP[s.status] ?? s.status,
    criadoEm:     formatData(s.created_at),
    aprovadoPor:  s.aprovado_rh_nome,
    negadoPor:    s.negado_por_nome,
    justificativa: s.justificativa_negacao,
  }))
}

async function getMatriculaByMatriculaId(matriculaId: string): Promise<string> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('matriculas')
    .select('matricula')
    .eq('id', matriculaId)
    .single()
  return data?.matricula ?? ''
}