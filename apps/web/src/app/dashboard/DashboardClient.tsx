'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import type { DashboardKpis, AprovacaoRecente, ServidorEmDescanso } from '@/lib/queries/dashboard'

const ACTION_CARDS = [
  { color:'accent', badge: true,  icon:'check-cal', title:'Aprovar solicitações',  desc:'Pedidos aguardando sua análise', href:'/aprovacoes'   },
  { color:'navy',   badge: false, icon:'cal-plus',  title:'Nova solicitação',      desc:'Registrar férias para um servidor', href:'/ferias'    },
  { color:'green',  badge: false, icon:'users',     title:'Consultar servidores',  desc:'Ver saldos, histórico e dados',  href:'/servidores'   },
  { color:'amber',  badge: false, icon:'user-plus', title:'Cadastrar servidor',    desc:'Adicionar novo servidor ao sistema', href:'/servidores/novo' },
  { color:'purple', badge: false, icon:'file',      title:'Gerar relatório',       desc:'Exportar PDF por setor ou período', href:'/relatorios' },
  { color:'red',    badge: false, icon:'clock',     title:'Saldos em risco',       desc:'Servidores próximos ao vencimento', href:'/servidores' },
]

function pillClass(s: string) {
  if (s === 'Aprovado') return 'pill ok'
  if (s === 'Pendente') return 'pill wait'
  if (s === 'Em descanso')  return 'pill blue'
  return 'pill no'
}

function Icon({ t }: { t: string }) {
  const p = { stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' }
  switch(t) {
    case 'grid':      return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal': return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':       return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal-plus':  return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg>
    case 'users':     return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'user-plus': return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 8v6M16 11h6"/></svg>
    case 'file':      return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'clock':     return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
    case 'settings':  return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':    return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':      return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'bell':      return <svg {...p} width={16} height={16}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'user':      return <svg {...p} width={16} height={16}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    case 'search':    return <svg {...p} width={14} height={14}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    case 'warn':      return <svg {...p} width={16} height={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  kpis: DashboardKpis
  aprovacoes: AprovacaoRecente[]
  emGozo: ServidorEmDescanso[]
}

export default function DashboardClient({ kpis, aprovacoes, emGozo }: Props) {
  const router  = useRouter()
  const [search, setSearch] = useState('')
  const hour    = new Date().getHours()
  const greeting = hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const month   = new Date().toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  const KPIS = [
    { label:'Servidores ativos',    value: kpis.totalServidoresAtivos, delta:'Total cadastrado',            type:'neutral' },
    { label:'Aprovações pendentes', value: kpis.pendentesAprovacao,    delta: kpis.pendentesAprovacao > 0 ? 'Aguardando' : 'Em dia', type: kpis.pendentesAprovacao > 0 ? 'warn' : 'up' },
    { label:'Aprovações este mês',  value: kpis.aprovacoesMesAtual,    delta:'Mês atual',                  type:'up'     },
    { label:'Em risco de perda',    value: kpis.servidoresEmRisco,     delta: kpis.servidoresEmRisco > 0 ? 'Atenção' : 'Sem risco', type: kpis.servidoresEmRisco > 0 ? 'down' : 'up' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --navy:#06224A;--navy-mid:#0D3570;--accent:#3B7BF6;
          --text:#1a1a2e;--text2:#4a5568;--text3:#9aa5b4;
          --border:#e2e8f0;--border2:#cbd5e0;
          --surface:#f7f8fc;--surface2:#edf0f5;--white:#fff;
          --serif:'Instrument Serif',serif;--sans:'DM Sans',sans-serif;
          --green:#16a34a;--green-bg:#f0fdf4;
          --amber:#d97706;--amber-bg:#fffbeb;--amber-border:#fde68a;
          --red:#dc2626;--red-bg:#fef2f2;
          --blue:#3B7BF6;--blue-bg:#eff6ff;
          --purple:#7C3AED;
          --sh:0 1px 3px rgba(0,0,0,.06);--sh-md:0 4px 12px rgba(0,0,0,.08);
          --r:12px;--r-sm:8px;
        }
        html,body{height:100%;font-family:var(--sans);-webkit-font-smoothing:antialiased;background:var(--surface)}
        .shell{display:flex;height:100vh;overflow:hidden}
        .sidebar{width:232px;min-width:232px;background:var(--navy);display:flex;flex-direction:column;position:relative}
        .sidebar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,rgba(0,0,0,.18));pointer-events:none}
        .sb-logo{padding:20px 18px 10px;display:flex;align-items:center;gap:10px}
        .sb-logo-mark{width:28px;height:28px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:7px;display:flex;align-items:center;justify-content:center}
        .sb-logo-name{font-family:var(--serif);font-size:17px;color:#fff;letter-spacing:.5px}
        .sb-section{padding:16px 18px 6px;font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.22)}
        .sb-nav{flex:1;padding:0 10px;overflow-y:auto}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r-sm);color:rgba(255,255,255,.55);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s}
        .nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.8)}
        .nav-item.active{background:rgba(59,123,246,.22);color:#fff}
        .nb{margin-left:auto;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:100px}
        .sb-user{position:relative;z-index:1;margin:8px 10px 12px;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:10px;display:flex;align-items:center;gap:9px;cursor:pointer;transition:background .2s}
        .sb-user:hover{background:rgba(255,255,255,.1)}
        .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .su-name{font-size:12.5px;font-weight:600;color:#fff}
        .su-role{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .tb-right{display:flex;align-items:center;gap:10px}
        .tb-search{display:flex;align-items:center;gap:7px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:7px 12px;transition:all .2s}
        .tb-search:focus-within{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(59,123,246,.1)}
        .tb-search input{border:none;background:transparent;font-family:var(--sans);font-size:13px;color:var(--text);outline:none;width:180px}
        .tb-search input::placeholder{color:var(--text3)}
        .icon-btn{width:34px;height:34px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;flex-shrink:0}
        .icon-btn:hover{background:var(--surface)}
        .notif-dot{position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--red);border:1.5px solid #fff}
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .rh-greeting{margin-bottom:18px}
        .rh-greeting h2{font-size:19px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .rh-greeting p{font-size:13px;color:var(--text3);margin-top:4px}
        .alert-strip{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--amber-border);border-radius:var(--r);padding:14px 16px;margin-bottom:20px;box-shadow:var(--sh)}
        .alert-icon{width:34px;height:34px;border-radius:9px;background:var(--amber-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--amber)}
        .alert-text{flex:1;min-width:0}
        .alert-text strong{font-size:13.5px;font-weight:600;color:var(--text);display:block}
        .alert-text p{font-size:12px;color:var(--text3);margin-top:2px}
        .btn{padding:7px 14px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;flex-shrink:0}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
        .ac{background:#fff;border:1.5px solid var(--border);border-radius:var(--r);padding:16px;cursor:pointer;transition:all .22s;position:relative;overflow:hidden}
        .ac::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:12px 12px 0 0;opacity:0;transition:opacity .22s}
        .ac:hover{border-color:var(--border2);transform:translateY(-3px);box-shadow:var(--sh-md)}
        .ac:hover::before{opacity:1}
        .ac.accent::before{background:var(--accent)}.ac.navy::before{background:var(--navy)}.ac.green::before{background:var(--green)}.ac.amber::before{background:var(--amber)}.ac.purple::before{background:var(--purple)}.ac.red::before{background:var(--red)}
        .ac-badge{position:absolute;top:12px;right:12px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:100px}
        .ac-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .ac.accent .ac-icon{background:var(--blue-bg);color:var(--accent)}.ac.navy .ac-icon{background:rgba(6,34,74,.07);color:var(--navy)}.ac.green .ac-icon{background:var(--green-bg);color:var(--green)}.ac.amber .ac-icon{background:var(--amber-bg);color:var(--amber)}.ac.purple .ac-icon{background:rgba(124,58,237,.08);color:var(--purple)}.ac.red .ac-icon{background:var(--red-bg);color:var(--red)}
        .ac-title{font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:4px}
        .ac-desc{font-size:12px;color:var(--text3);line-height:1.5}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ac:nth-child(1){animation:fadeUp .3s ease .00s both}.ac:nth-child(2){animation:fadeUp .3s ease .04s both}.ac:nth-child(3){animation:fadeUp .3s ease .08s both}.ac:nth-child(4){animation:fadeUp .3s ease .12s both}.ac:nth-child(5){animation:fadeUp .3s ease .16s both}.ac:nth-child(6){animation:fadeUp .3s ease .20s both}
        .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
        .kpi{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;box-shadow:var(--sh)}
        .kpi-val{font-family:var(--serif);font-size:32px;color:var(--text);letter-spacing:-1.5px}
        .kpi-lbl{font-size:12px;color:var(--text3);margin-top:2px;font-weight:500}
        .kpi-delta{font-size:11.5px;margin-top:8px;font-weight:500}
        .up{color:var(--green)}.warn{color:var(--amber)}.down{color:var(--red)}.neutral{color:var(--text3)}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card{background:#fff;border-radius:var(--r);border:1px solid var(--border);box-shadow:var(--sh)}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}
        .card-head h3{font-size:14px;font-weight:600;color:var(--text);letter-spacing:-.2px}
        .mt{width:100%;border-collapse:collapse}
        .mt th{padding:8px 18px;font-size:11px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:.5px;background:var(--surface);border-bottom:1px solid var(--border)}
        .mt td{padding:10px 18px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
        .mt tr:last-child td{border-bottom:none}
        .mt tbody tr{cursor:pointer;transition:background .15s}
        .mt tbody tr:hover{background:var(--surface)}
        .bold{font-weight:600;color:var(--text)}
        .empty-row td{text-align:center;color:var(--text3);font-size:13px;padding:24px}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.no{background:var(--red-bg);color:var(--red)}.pill.no::before{background:var(--red)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}
        @media(max-width:1100px){.action-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){.kpi-row{grid-template-columns:repeat(2,1fr)}.two-col{grid-template-columns:1fr}.sidebar{display:none}}
      `}</style>

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
              <div className="icon-btn" onClick={() => router.push('/aprovacoes')}>
                <Icon t="bell" />
                {kpis.pendentesAprovacao > 0 && <div className="notif-dot" />}
              </div>
              <div className="icon-btn"><Icon t="user" /></div>
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