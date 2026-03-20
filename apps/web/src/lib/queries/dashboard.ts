import { createServerClient } from '@/lib/supabase-server'

export interface DashboardKpis {
  totalServidoresAtivos: number
  servidoresEmRisco: number
  aprovacoesMesAtual: number
  pendentesAprovacao: number
  servidoresEmDescanso: number
  tempoMedioAprovacaoHoras: number | null
}

export interface AprovacaoRecente {
  nome: string
  matricula: string
  periodo: string
  status: string
}

export interface ServidorEmDescanso {
  nome: string
  retorno: string
  dias: number
}

// ── KPIs principais ───────────────────────────────────────────
export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('vw_dashboard_kpis')
    .select('*')
    .single()

  if (error || !data) {
    console.error('[getDashboardKpis]', error?.message)
    return {
      totalServidoresAtivos: 0,
      servidoresEmRisco: 0,
      aprovacoesMesAtual: 0,
      pendentesAprovacao: 0,
      servidoresEmDescanso: 0,
      tempoMedioAprovacaoHoras: null,
    }
  }

  return {
    totalServidoresAtivos:    data.total_servidores_ativos     ?? 0,
    servidoresEmRisco:        data.servidores_em_risco_perda   ?? 0,
    aprovacoesMesAtual:       data.aprovacoes_mes_atual        ?? 0,
    pendentesAprovacao:       data.pendentes_aprovacao         ?? 0,
    servidoresEmDescanso:         data.servidores_em_descanso_hoje     ?? 0,
    tempoMedioAprovacaoHoras: data.tempo_medio_aprovacao_horas ?? null,
  }
}

// ── Aprovações recentes ───────────────────────────────────────
export async function getAprovacoesRecentes(): Promise<AprovacaoRecente[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('solicitacoes')
    .select(`
      status,
      data_inicio,
      data_fim,
      matriculas (
        matricula,
        funcionarios ( nome )
      )
    `)
    .in('status', ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'EM_GOZO'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[getAprovacoesRecentes]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => {
    const inicio  = new Date(s.data_inicio).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
    const fim     = new Date(s.data_fim).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
    const statusMap: Record<string, string> = {
      PENDENTE:   'Pendente',
      EM_ANALISE: 'Pendente',
      APROVADO:   'Aprovado',
      EM_GOZO:    'Em descanso',
      NEGADO:     'Reprovado',
    }
    return {
      nome:      s.matriculas?.funcionarios?.nome ?? '—',
      matricula: s.matriculas?.matricula ?? '—',
      periodo:   `${inicio}–${fim}`,
      status:    statusMap[s.status] ?? s.status,
    }
  })
}

// ── Servidores em descanso hoje ───────────────────────────────────
export async function getServidoresEmDescanso(): Promise<ServidorEmDescanso[]> {
  const supabase = createServerClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('solicitacoes')
    .select(`
      data_inicio,
      data_fim,
      dias_solicitados,
      matriculas (
        funcionarios ( nome )
      )
    `)
    .eq('status', 'EM_GOZO')
    .lte('data_inicio', hoje)
    .gte('data_fim', hoje)
    .order('data_fim', { ascending: true })
    .limit(5)

  if (error) {
    console.error('[getServidoresEmDescanso]', error.message)
    return []
  }

  return (data ?? []).map((s: any) => ({
    nome:    s.matriculas?.funcionarios?.nome ?? '—',
    retorno: new Date(s.data_fim).toLocaleDateString('pt-BR'),
    dias:    s.dias_solicitados,
  }))
}