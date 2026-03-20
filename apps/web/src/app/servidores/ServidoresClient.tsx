'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import type { ServidorListItem, ServidoresStats } from '@/lib/queries/servidores'

function saldoPill(saldo: number) {
  if (saldo >= 75) return 'pill no'
  if (saldo >= 45) return 'pill wait'
  return 'pill ok'
}

function situacaoPill(s: string) {
  if (s === 'Ativo')       return 'pill ok'
  if (s === 'Em descanso')     return 'pill blue'
  if (s === 'Risco perda') return 'pill wait'
  return 'pill no'
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')
}

function NavIcon({ t }: { t: string }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
  switch (t) {
    case 'grid':     return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal':return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':      return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':    return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'file':     return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':   return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':     return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'search':   return <svg {...p} width={15} height={15}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    case 'warn':     return <svg {...p} width={16} height={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'plus':     return <svg {...p} width={14} height={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'x':        return <svg {...p} width={12} height={12}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    case 'filter':   return <svg {...p} width={14} height={14}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>
    default:         return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  servidores: ServidorListItem[]
  stats: ServidoresStats
}

export default function ServidoresClient({ servidores, stats }: Props) {
  const router = useRouter()
  const [busca, setBusca]               = useState('')
  const [setor, setSetor]               = useState('Todos')
  const [filtroSituacao, setFiltroSituacao] = useState('Todos')
  const [filtroRisco, setFiltroRisco]   = useState(false)

  const setores = ['Todos', ...Array.from(new Set(servidores.map(s => s.setor))).sort()]

  const filtrados = useMemo(() => {
    return servidores.filter(s => {
      const q = busca.toLowerCase()
      const matchBusca    = !busca || s.nome.toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q) || s.cargo.toLowerCase().includes(q)
      const matchSetor    = setor === 'Todos' || s.setor === setor
      const matchRisco    = !filtroRisco || s.saldo >= 75
      const matchSituacao = filtroSituacao === 'Todos' || s.situacao === filtroSituacao
      return matchBusca && matchSetor && matchRisco && matchSituacao
    })
  }, [servidores, busca, setor, filtroRisco, filtroSituacao])

  const filtrosAtivos = (setor !== 'Todos' ? 1 : 0) + (filtroRisco ? 1 : 0) + (filtroSituacao !== 'Todos' ? 1 : 0)

  function limparFiltros() {
    setSetor('Todos'); setFiltroRisco(false); setFiltroSituacao('Todos'); setBusca('')
  }

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
          --red:#dc2626;--red-bg:#fef2f2;--red-border:#fecaca;
          --blue:#3B7BF6;--blue-bg:#eff6ff;
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
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .alert-risco{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--amber-border);border-radius:var(--r);padding:12px 16px;margin-bottom:18px;box-shadow:var(--sh);cursor:pointer;transition:background .15s}
        .alert-risco:hover{background:var(--amber-bg)}
        .alert-risco-icon{width:32px;height:32px;border-radius:8px;background:var(--amber-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--amber)}
        .alert-risco-text strong{font-size:13px;font-weight:600;color:var(--text)}
        .alert-risco-text p{font-size:12px;color:var(--text3);margin-top:1px}
        .alert-risco-btn{margin-left:auto;font-size:12px;font-weight:600;color:var(--amber);white-space:nowrap}
        .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
        .search-wrap{position:relative;flex:1;min-width:220px}
        .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
        .search-inp{width:100%;padding:8px 12px 8px 34px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--white);font-family:var(--sans);font-size:13px;color:var(--text);outline:none;transition:all .2s}
        .search-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,123,246,.11)}
        .f-select{padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--white);font-family:var(--sans);font-size:13px;color:var(--text2);outline:none;cursor:pointer}
        .btn{padding:8px 14px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover{background:var(--navy-mid)}
        .btn.risco-on{background:var(--amber-bg);border-color:var(--amber-border);color:var(--amber);font-weight:600}
        .chip{display:inline-flex;align-items:center;gap:5px;background:var(--surface2);border:1px solid var(--border);border-radius:100px;padding:3px 10px;font-size:11.5px;color:var(--text2);cursor:pointer}
        .chip:hover{background:var(--red-bg);border-color:#fecaca;color:var(--red)}
        .card{background:#fff;border-radius:var(--r);border:1px solid var(--border);box-shadow:var(--sh);overflow:hidden}
        .ft{width:100%;border-collapse:collapse}
        .ft th{padding:10px 16px;font-size:10.5px;font-weight:600;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;background:var(--surface2);border-bottom:1px solid var(--border);text-align:left;white-space:nowrap}
        .ft td{padding:13px 16px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border);white-space:nowrap}
        .ft tr:last-child td{border-bottom:none}
        .ft tbody tr{transition:background .12s;cursor:pointer}
        .ft tbody tr:hover{background:var(--surface)}
        .ft tbody tr.risco-row{background:rgba(251,191,36,.04)}
        .ft tbody tr.risco-row:hover{background:rgba(251,191,36,.08)}
        .td-nome{display:flex;align-items:center;gap:10px}
        .td-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#c7d9f7,#e8f0fd);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--navy-mid);flex-shrink:0;letter-spacing:.3px}
        .td-bold{font-weight:600;color:var(--text);font-size:13.5px}
        .td-mono{font-size:11.5px;color:var(--text3);font-family:monospace;font-weight:500}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.no{background:var(--red-bg);color:var(--red)}.pill.no::before{background:var(--red)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}
        .empty{padding:48px 20px;text-align:center;font-size:13.5px;color:var(--text3)}
        .table-footer{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);background:var(--surface2)}
        .tf-count{font-size:12.5px;color:var(--text3)}
        @media(max-width:768px){.sidebar{display:none}.toolbar{flex-direction:column;align-items:stretch}}
      `}</style>

      <div className="shell">
        <Sidebar variant="admin" activeItem="servidores" />

        <div className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">Servidores</div>
              <div className="tb-sub">
                {stats.total} cadastrados · {stats.ativos} ativos · {stats.emRisco} em risco de perda
              </div>
            </div>
            <button className="btn navy" onClick={() => router.push('/servidores/novo')}>
              <NavIcon t="plus" />Novo servidor
            </button>
          </div>

          <div className="content">
            {stats.emRisco > 0 && (
              <div className="alert-risco" onClick={() => setFiltroRisco(true)}>
                <div className="alert-risco-icon"><NavIcon t="warn" /></div>
                <div className="alert-risco-text">
                  <strong>{stats.emRisco} servidores em risco de perda de férias</strong>
                  <p>Saldos ≥ 75 dias com vencimento próximo</p>
                </div>
                <span className="alert-risco-btn">Ver lista →</span>
              </div>
            )}

            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><NavIcon t="search" /></span>
                <input
                  className="search-inp"
                  placeholder="Buscar por nome, matrícula ou cargo…"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
              <select className="f-select" value={setor} onChange={e => setSetor(e.target.value)}>
                {setores.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="f-select" value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)}>
                {['Todos', 'Ativo', 'Em descanso', 'Risco perda', 'Inativo'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className={`btn${filtroRisco ? ' risco-on' : ''}`} onClick={() => setFiltroRisco(v => !v)}>
                <NavIcon t="warn" />{filtroRisco ? 'Somente risco' : 'Filtrar risco'}
              </button>
              {filtrosAtivos > 0 && (
                <div className="chip" onClick={limparFiltros}>
                  <NavIcon t="x" />Limpar {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="card">
              <table className="ft">
                <thead>
                  <tr>
                    <th>Nome</th><th>Matrícula</th><th>Setor</th>
                    <th>Cargo</th><th>Saldo férias</th><th>Situação</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty">Nenhum servidor encontrado com os filtros aplicados.</div></td></tr>
                  ) : filtrados.map(s => (
                    <tr
                      key={s.id}
                      className={s.saldo >= 75 ? 'risco-row' : ''}
                      onClick={() => router.push(`/servidores/${s.id}`)}
                    >
                      <td>
                        <div className="td-nome">
                          <div className="td-avatar">{iniciais(s.nome)}</div>
                          <span className="td-bold">{s.nome}</span>
                        </div>
                      </td>
                      <td><span className="td-mono">{s.matricula}</span></td>
                      <td>{s.setor}</td>
                      <td>{s.cargo}</td>
                      <td><span className={saldoPill(s.saldo)}>{s.saldo}d{s.saldo >= 75 ? ' !' : ''}</span></td>
                      <td><span className={situacaoPill(s.situacao)}>{s.situacao}</span></td>
                      <td>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 11.5 }}
                          onClick={e => { e.stopPropagation(); router.push(`/servidores/${s.id}`) }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <span className="tf-count">
                  {filtrados.length} de {stats.total} servidor{stats.total !== 1 ? 'es' : ''}
                  {filtrosAtivos > 0 ? ` (${filtrosAtivos} filtro${filtrosAtivos > 1 ? 's' : ''} ativo${filtrosAtivos > 1 ? 's' : ''})` : ''}
                </span>
                <span className="tf-count">
                  {filtrados.filter(s => s.saldo >= 75).length} em risco nesta visualização
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}