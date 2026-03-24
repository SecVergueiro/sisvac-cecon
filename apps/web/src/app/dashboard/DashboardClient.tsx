'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import type { DashboardKpis, AprovacaoRecente, ServidorEmDescanso } from '@/lib/queries/dashboard'

const ACTION_CARDS = [
  { color: 'accent', badge: true, icon: 'check-cal', title: 'Aprovar solicitações', desc: 'Pedidos aguardando sua análise', href: '/aprovacoes' },
  { color: 'navy', badge: false, icon: 'cal-plus', title: 'Nova solicitação', desc: 'Registrar férias para um servidor', href: '/ferias' },
  { color: 'green', badge: false, icon: 'users', title: 'Consultar servidores', desc: 'Ver saldos, histórico e dados', href: '/servidores' },
  { color: 'amber', badge: false, icon: 'user-plus', title: 'Cadastrar servidor', desc: 'Adicionar novo servidor ao sistema', href: '/servidores/novo' },
  { color: 'purple', badge: false, icon: 'file', title: 'Gerar relatório', desc: 'Exportar PDF por setor ou período', href: '/relatorios' },
  { color: 'red', badge: false, icon: 'clock', title: 'Saldos em risco', desc: 'Servidores próximos ao vencimento', href: '/servidores' },
]

function pillClass(s: string) {
  if (s === 'Aprovado') return 'pill ok'
  if (s === 'Pendente') return 'pill wait'
  if (s === 'Em descanso') return 'pill blue'
  return 'pill no'
}

function Icon({ t }: { t: string }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
  switch (t) {
    case 'grid': return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'check-cal': return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case 'cal': return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case 'cal-plus': return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" /></svg>
    case 'users': return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" /></svg>
    case 'user-plus': return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M19 8v6M16 11h6" /></svg>
    case 'file': return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
    case 'clock': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
    case 'logout': return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    case 'logo': return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    case 'bell': return <svg {...p} width={16} height={16}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
    case 'user': return <svg {...p} width={16} height={16}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
    case 'search': return <svg {...p} width={14} height={14}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
    case 'warn': return <svg {...p} width={16} height={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    default: return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10" /></svg>
  }
}

interface Props {
  kpis: DashboardKpis
  aprovacoes: AprovacaoRecente[]
  emGozo: ServidorEmDescanso[]
}

export default function DashboardClient({ kpis, aprovacoes, emGozo }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const KPIS = [
    { label: 'Servidores ativos', value: kpis.totalServidoresAtivos, delta: 'Total cadastrado', type: 'neutral' },
    { label: 'Aprovações pendentes', value: kpis.pendentesAprovacao, delta: kpis.pendentesAprovacao > 0 ? 'Aguardando' : 'Em dia', type: kpis.pendentesAprovacao > 0 ? 'warn' : 'up' },
    { label: 'Aprovações este mês', value: kpis.aprovacoesMesAtual, delta: 'Mês atual', type: 'up' },
    { label: 'Em risco de perda', value: kpis.servidoresEmRisco, delta: kpis.servidoresEmRisco > 0 ? 'Atenção' : 'Sem risco', type: kpis.servidoresEmRisco > 0 ? 'down' : 'up' },
  ]

  return (
    <>
      <div className="shell">
        <Sidebar variant="admin" activeItem="inicio" pendentesCount={kpis.pendentesAprovacao} />

        <div className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">Início</div>
              <div className="tb-sub">{greeting} · {month.charAt(0).toUpperCase() + month.slice(1)}</div>
            </div>
            <div className="tb-right">
              <div className="tb-search">
                <Icon t="search" />
                <input placeholder="Buscar servidor…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="icon-btn" onClick={() => router.push('/aprovacoes')} title="Aprovações Pendentes">
                <Icon t="bell" />
                {kpis.pendentesAprovacao > 0 && <div className="notif-dot" />}
              </div>

              {/* Transformamos a div do usuário em um Link apontando para as configurações */}
              <Link href="/configuracoes" className="icon-btn" title="Configurações e Perfil">
                <Icon t="user" />
              </Link>

            </div>
          </div>

          <div className="content">
            <div className="rh-greeting">
              <h2>O que você precisa fazer hoje?</h2>
              <p>Selecione uma ação abaixo ou acompanhe os indicadores da fundação</p>
            </div>

            {kpis.servidoresEmRisco > 0 && (
              <div className="alert-strip">
                <div className="alert-icon"><Icon t="warn" /></div>
                <div className="alert-text">
                  <strong>{kpis.servidoresEmRisco} servidor{kpis.servidoresEmRisco !== 1 ? 'es' : ''} em risco de perda de férias</strong>
                  <p>Saldos com vencimento nos próximos 60 dias sem solicitação em aberto</p>
                </div>
                <button className="btn" onClick={() => router.push('/servidores')}>Ver lista</button>
              </div>
            )}

            <div className="action-grid">
              {ACTION_CARDS.map((card, i) => (
                <div key={i} className={`ac ${card.color}`} onClick={() => router.push(card.href)}>
                  {card.badge && kpis.pendentesAprovacao > 0 && (
                    <div className="ac-badge">{kpis.pendentesAprovacao}</div>
                  )}
                  <div className="ac-icon"><Icon t={card.icon} /></div>
                  <div className="ac-title">{card.title}</div>
                  <div className="ac-desc">{card.desc}</div>
                </div>
              ))}
            </div>

            <div className="kpi-row">
              {KPIS.map(k => (
                <div className="kpi" key={k.label}>
                  <div className="kpi-val">{k.value}</div>
                  <div className="kpi-lbl">{k.label}</div>
                  <div className={`kpi-delta ${k.type}`}>{k.delta}</div>
                </div>
              ))}
            </div>

            <div className="two-col">
              <div className="card">
                <div className="card-head">
                  <h3>Aprovações recentes</h3>
                  <button className="btn" onClick={() => router.push('/aprovacoes')}>Ver todas</button>
                </div>
                <table className="mt">
                  <thead><tr><th>Servidor</th><th>Período</th><th>Status</th></tr></thead>
                  <tbody>
                    {aprovacoes.length === 0 ? (
                      <tr className="empty-row"><td colSpan={3}>Nenhuma solicitação recente</td></tr>
                    ) : aprovacoes.map((a, i) => (
                      <tr key={i}>
                        <td className="bold">{a.nome}</td>
                        <td>{a.periodo}</td>
                        <td><span className={pillClass(a.status)}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div className="card-head">
                  <h3>Servidores em descanso hoje</h3>
                  <span className="pill blue">{kpis.servidoresEmDescanso} ativo{kpis.servidoresEmDescanso !== 1 ? 's' : ''}</span>
                </div>
                <table className="mt">
                  <thead><tr><th>Servidor</th><th>Retorno</th><th>Dias</th></tr></thead>
                  <tbody>
                    {emGozo.length === 0 ? (
                      <tr className="empty-row"><td colSpan={3}>Nenhum servidor em descanso hoje</td></tr>
                    ) : emGozo.map((s, i) => (
                      <tr key={i}>
                        <td className="bold">{s.nome}</td>
                        <td>{s.retorno}</td>
                        <td>{s.dias}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}