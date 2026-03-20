'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import { criarSolicitacaoAction, getSaldosAction } from './actions'
import type { ServidorParaFerias } from '@/lib/queries/ferias'

type TipoAfastamento  = 'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'
type TipoFracionamento = 'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'

interface SaldoItem {
  idSaldo: string
  idExercicio: number
  exercicio: string
  diasDisponiveis: number
  emRisco: boolean
}

const FRACOS: { key: TipoFracionamento; label: string; dias: number }[] = [
  { key: 'INTEGRAL',      label: 'Integral (30d)', dias: 30 },
  { key: 'QUINZE_QUINZE', label: '15 + 15',        dias: 15 },
  { key: 'DEZ_VINTE',     label: '10 + 20',        dias: 10 },
  { key: 'DEZ_DEZ_DEZ',   label: '10 + 10 + 10',   dias: 10 },
]

function NavIcon({ t }: { t: string }) {
  const p = { stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' }
  switch(t) {
    case 'grid':      return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal': return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':       return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':     return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'file':      return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings':  return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':    return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':      return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'search':    return <svg {...p} width={15} height={15}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    case 'send':      return <svg {...p} width={15} height={15}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
    case 'ok':        return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    case 'warn':      return <svg {...p} width={14} height={14}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  servidores: ServidorParaFerias[]
  preSelectedId?: string
}

export default function FeriasClient({ servidores, preSelectedId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // form
  const [busca, setBusca]           = useState('')
  const [sugestoes, setSugestoes]   = useState<ServidorParaFerias[]>([])
  const [servidor, setServidor]     = useState<ServidorParaFerias | null>(null)
  const [saldos, setSaldos]         = useState<SaldoItem[]>([])
  const [saldoSelecionado, setSaldoSelecionado] = useState<SaldoItem | null>(null)
  const [tipo, setTipo]             = useState<TipoAfastamento>('FERIAS_INTEGRAL')
  const [fracao, setFracao]         = useState<TipoFracionamento>('INTEGRAL')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [obs, setObs]               = useState('')
  const [enviado, setEnviado]       = useState(false)
  const [erro, setErro]             = useState('')
  const [loadingSaldos, setLoadingSaldos] = useState(false)

  // calcula dias solicitados
  const diasSolicitados = dataInicio && dataFim
    ? Math.max(0, Math.round((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000) + 1)
    : 0

  // calcula data fim automaticamente
  useEffect(() => {
    if (!dataInicio || !saldoSelecionado) return
    const d = new Date(dataInicio)
    const dias = tipo === 'LICENCA_ESPECIAL' ? 90
      : tipo === 'FERIAS_INTEGRAL' ? 30
      : FRACOS.find(f => f.key === fracao)?.dias ?? 30
    d.setDate(d.getDate() + dias - 1)
    setDataFim(d.toISOString().split('T')[0])
  }, [dataInicio, fracao, tipo, saldoSelecionado])

  // busca servidores no autocomplete
  function filtrar(val: string) {
    setBusca(val)
    setServidor(null)
    setSaldos([])
    setSaldoSelecionado(null)
    if (val.length < 2) { setSugestoes([]); return }
    const q = val.toLowerCase()
    setSugestoes(servidores.filter(s =>
      s.nome.toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q)
    ).slice(0, 6))
  }

  // seleciona servidor e busca saldos reais
  async function selecionarServidor(s: ServidorParaFerias) {
    setServidor(s)
    setBusca(s.nome)
    setSugestoes([])
    setLoadingSaldos(true)
    const data = await getSaldosAction(s.idMatricula)
    setSaldos(data)
    if (data.length > 0) setSaldoSelecionado(data[data.length - 1]) // exercício mais recente
    setLoadingSaldos(false)
  }

  // Pre-fill
  useEffect(() => {
    if (preSelectedId && servidores.length > 0) {
      const match = servidores.find(x => x.idMatricula === preSelectedId || x.matricula === preSelectedId);
      if (match && !servidor) {
        selecionarServidor(match)
      }
    }
  }, [preSelectedId, servidores])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!servidor || !saldoSelecionado || !dataInicio || !dataFim) return
    setErro('')

    startTransition(async () => {
      const result = await criarSolicitacaoAction({
        idMatricula:      servidor.idMatricula,
        idExercicio:      saldoSelecionado.idExercicio,
        idSaldoFerias:    saldoSelecionado.idSaldo,
        tipoAfastamento:  tipo,
        tipoFracionamento: fracao,
        dataInicio,
        dataFim,
        diasSolicitados,
        observacoes: obs || undefined,
      })

      if (result.ok) {
        setEnviado(true)
      } else {
        setErro(result.error ?? 'Erro desconhecido')
      }
    })
  }

  function resetar() {
    setEnviado(false); setServidor(null); setBusca(''); setSaldos([])
    setSaldoSelecionado(null); setDataInicio(''); setDataFim(''); setObs(''); setErro('')
  }

  const iniciais = servidor?.nome.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('') ?? '?'

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
          --green:#16a34a;--green-bg:#f0fdf4;--green-border:#bbf7d0;
          --amber:#d97706;--amber-bg:#fffbeb;--amber-border:#fde68a;
          --red:#dc2626;--red-bg:#fef2f2;--red-border:#fecaca;
          --blue:#3B7BF6;--blue-bg:#eff6ff;
          --sh:0 1px 3px rgba(0,0,0,.06);--sh-md:0 4px 16px rgba(0,0,0,.1);
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
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);flex-shrink:0}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
        @media(max-width:960px){.layout{grid-template-columns:1fr}}
        .form-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:22px;margin-bottom:16px;box-shadow:var(--sh)}
        .form-card h4{font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .badge{font-size:11px;font-weight:600;background:var(--navy);color:#fff;padding:2px 8px;border-radius:100px}
        .f-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .f-field{display:flex;flex-direction:column;gap:5px}
        .f-field.full{grid-column:1/-1}
        .f-label{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.1px}
        .f-inp{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--surface);font-family:var(--sans);font-size:13.5px;color:var(--text);outline:none;transition:all .2s}
        .f-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,123,246,.11);background:#fff}
        .f-hint{font-size:11.5px;color:var(--text3);margin-top:2px}
        .f-error{font-size:12px;color:var(--red);margin-top:4px;display:flex;align-items:center;gap:4px}
        select.f-inp{cursor:pointer}
        textarea.f-inp{resize:vertical;min-height:72px}
        .search-wrap{position:relative}
        .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
        .search-inp{padding-left:34px !important}
        .ac-box{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid var(--border);border-radius:var(--r-sm);box-shadow:var(--sh-md);z-index:50;overflow:hidden}
        .ac-item{padding:10px 14px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
        .ac-item:last-child{border-bottom:none}
        .ac-item:hover{background:var(--surface)}
        .ac-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#c7d9f7,#e8f0fd);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--navy-mid);flex-shrink:0}
        .ac-nome{font-size:13px;font-weight:600;color:var(--text)}
        .ac-meta{font-size:11.5px;color:var(--text3)}
        .srv-sel{background:var(--blue-bg);border:1.5px solid #bfdbfe;border-radius:var(--r-sm);padding:12px 14px;display:flex;align-items:center;gap:12px;margin-top:4px}
        .srv-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .srv-nome{font-size:13.5px;font-weight:600;color:var(--text)}
        .srv-meta{font-size:12px;color:var(--text2);margin-top:1px}
        .srv-clear{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text3);padding:4px;border-radius:4px;font-size:16px;line-height:1}
        .srv-clear:hover{color:var(--red)}
        .split-row{display:flex;gap:8px;flex-wrap:wrap}
        .split-opt{padding:8px 14px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .18s}
        .split-opt:hover{border-color:var(--border2)}
        .split-opt.active{background:var(--navy);border-color:var(--navy);color:#fff}
        .f-actions{display:flex;gap:8px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border);margin-top:4px}
        .btn{padding:9px 18px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn:disabled{opacity:.55;cursor:not-allowed}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover:not(:disabled){background:var(--navy-mid);transform:translateY(-1px);box-shadow:0 4px 12px rgba(6,34,74,.2)}
        .spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .saldo-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:18px;margin-bottom:14px;box-shadow:var(--sh)}
        .saldo-card h4{font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:14px}
        .saldo-row{padding:10px 0;border-bottom:1px solid var(--border)}
        .saldo-row:last-child{border-bottom:none;padding-bottom:0}
        .saldo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .saldo-lbl{font-size:12.5px;color:var(--text2);font-weight:500}
        .saldo-val{font-family:var(--serif);font-size:16px;color:var(--text)}
        .prog{background:var(--surface2);border-radius:100px;height:5px;overflow:hidden}
        .prog-fill{height:100%;border-radius:100px;background:var(--accent);transition:width .5s ease}
        .prog-fill.warn{background:var(--amber)}
        .prog-fill.risk{background:var(--red)}
        .saldo-skeleton{background:var(--surface2);border-radius:6px;height:14px;animation:pulse 1.5s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .alert-box{background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--r-sm);padding:10px 14px;font-size:13px;color:var(--red);display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .success-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;padding:64px 32px;animation:fadeUp .4s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .success-icon{width:64px;height:64px;background:var(--green-bg);border:2px solid var(--green-border);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .success-icon svg{width:28px;height:28px;stroke:var(--green);fill:none;stroke-width:2.5;stroke-linecap:round}
        .success-wrap h2{font-family:var(--serif);font-size:26px;color:var(--text);margin-bottom:8px}
        .success-wrap p{font-size:14px;color:var(--text2);line-height:1.6;max-width:380px;margin-bottom:24px}
        @media(max-width:768px){.sidebar{display:none}.f-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="shell">
        <Sidebar variant="admin" activeItem="ferias" />

        <div className="main">
          <div className="topbar">
            <div className="tb-title">Nova solicitação</div>
            <div className="tb-sub">Registrar férias ou licença para um servidor</div>
          </div>

          <div className="content">
            {enviado ? (
              <div className="success-wrap">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
                </div>
                <h2>Solicitação registrada!</h2>
                <p>
                  A solicitação de férias de <strong>{servidor?.nome}</strong> foi salva com sucesso e já aparece na fila de aprovações.
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn" onClick={resetar}>Nova solicitação</button>
                  <button className="btn navy" onClick={() => router.push('/aprovacoes')}>Ver aprovações</button>
                </div>
              </div>
            ) : (
              <div className="layout">
                <form onSubmit={handleSubmit}>
                  {/* STEP 1 — Servidor */}
                  <div className="form-card">
                    <h4><span className="badge">1</span>Dados do servidor</h4>
                    <div className="f-field">
                      <label className="f-label">Buscar servidor</label>
                      {servidor ? (
                        <div className="srv-sel">
                          <div className="srv-av">{iniciais}</div>
                          <div>
                            <div className="srv-nome">{servidor.nome}</div>
                            <div className="srv-meta">{servidor.matricula} · {servidor.setor}</div>
                          </div>
                          <button type="button" className="srv-clear" onClick={() => { setServidor(null); setBusca(''); setSaldos([]); setSaldoSelecionado(null) }}>✕</button>
                        </div>
                      ) : (
                        <div className="search-wrap">
                          <span className="search-icon"><NavIcon t="search" /></span>
                          <input
                            className="f-inp search-inp"
                            placeholder="Nome ou matrícula…"
                            value={busca}
                            onChange={e => filtrar(e.target.value)}
                            autoComplete="off"
                          />
                          {sugestoes.length > 0 && (
                            <div className="ac-box">
                              {sugestoes.map(s => (
                                <div key={s.idMatricula} className="ac-item" onClick={() => selecionarServidor(s)}>
                                  <div className="ac-av">{s.nome.split(' ').slice(0,2).map((n:string) => n[0]).join('')}</div>
                                  <div>
                                    <div className="ac-nome">{s.nome}</div>
                                    <div className="ac-meta">{s.matricula} · {s.setor}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 2 — Período */}
                  {servidor && (
                    <div className="form-card">
                      <h4><span className="badge">2</span>Período e tipo</h4>
                      <div className="f-grid">
                        <div className="f-field">
                          <label className="f-label">Tipo de afastamento</label>
                          <select className="f-inp" value={tipo} onChange={e => { setTipo(e.target.value as TipoAfastamento); setFracao('INTEGRAL') }}>
                            <option value="FERIAS_INTEGRAL">Férias regulares (30 dias)</option>
                            <option value="FERIAS_FRACIONADA">Férias fracionadas</option>
                            <option value="LICENCA_ESPECIAL">Licença especial (90 dias)</option>
                          </select>
                        </div>
                        <div className="f-field">
                          <label className="f-label">Exercício</label>
                          <select
                            className="f-inp"
                            value={saldoSelecionado?.idSaldo ?? ''}
                            onChange={e => setSaldoSelecionado(saldos.find(s => s.idSaldo === e.target.value) ?? null)}
                          >
                            {loadingSaldos
                              ? <option>Carregando…</option>
                              : saldos.map(s => (
                                <option key={s.idSaldo} value={s.idSaldo}>
                                  {s.exercicio} — {s.diasDisponiveis}d disponíveis{s.emRisco ? ' ⚠' : ''}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                        <div className="f-field">
                          <label className="f-label">Data de início</label>
                          <input className="f-inp" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                        </div>
                        <div className="f-field">
                          <label className="f-label">Data de retorno</label>
                          <input className="f-inp" type="date" value={dataFim} readOnly style={{ background:'var(--surface2)', color:'var(--text2)' }} />
                          {diasSolicitados > 0 && <span className="f-hint">{diasSolicitados} dias solicitados</span>}
                        </div>

                        {(tipo === 'FERIAS_INTEGRAL' || tipo === 'FERIAS_FRACIONADA') && (
                          <div className="f-field full">
                            <label className="f-label">Fracionamento</label>
                            <div className="split-row">
                              {FRACOS.filter(f => tipo === 'FERIAS_FRACIONADA' ? f.key !== 'INTEGRAL' : f.key === 'INTEGRAL').map(f => (
                                <div key={f.key} className={`split-opt${fracao === f.key ? ' active' : ''}`} onClick={() => setFracao(f.key)}>
                                  {f.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="f-field full">
                          <label className="f-label">Observações</label>
                          <textarea className="f-inp" rows={3} placeholder="Informações adicionais…" value={obs} onChange={e => setObs(e.target.value)} />
                        </div>
                      </div>

                      {erro && (
                        <div className="alert-box">
                          <NavIcon t="warn" />{erro}
                        </div>
                      )}

                      <div className="f-actions">
                        <button type="button" className="btn" onClick={() => router.push('/dashboard')}>Cancelar</button>
                        <button
                          type="submit"
                          className="btn navy"
                          disabled={!servidor || !saldoSelecionado || !dataInicio || isPending}
                        >
                          {isPending ? <><span className="spinner"/>Salvando…</> : <><NavIcon t="send"/>Enviar solicitação</>}
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* PAINEL DIREITO */}
                <div>
                  <div className="saldo-card">
                    <h4>Saldo disponível</h4>
                    {loadingSaldos ? (
                      <>
                        <div className="saldo-skeleton" style={{ marginBottom:12 }} />
                        <div className="saldo-skeleton" style={{ width:'60%' }} />
                      </>
                    ) : saldoSelecionado ? (
                      <>
                        <div className="saldo-row">
                          <div className="saldo-top">
                            <span className="saldo-lbl">Exercício {saldoSelecionado.exercicio}</span>
                            <span className="saldo-val">{saldoSelecionado.diasDisponiveis} dias</span>
                          </div>
                          <div className="prog">
                            <div
                              className={`prog-fill${saldoSelecionado.diasDisponiveis >= 75 ? ' risk' : saldoSelecionado.diasDisponiveis >= 45 ? ' warn' : ''}`}
                              style={{ width:`${Math.min((saldoSelecionado.diasDisponiveis/30)*100, 100)}%` }}
                            />
                          </div>
                          {saldoSelecionado.emRisco && (
                            <div style={{ fontSize:11.5, color:'var(--amber)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                              <NavIcon t="warn" />Saldo em risco de perda
                            </div>
                          )}
                        </div>
                        {diasSolicitados > 0 && (
                          <div className="saldo-row">
                            <div className="saldo-top">
                              <span className="saldo-lbl">Após esta solicitação</span>
                              <span className="saldo-val" style={{ color: saldoSelecionado.diasDisponiveis - diasSolicitados < 0 ? 'var(--red)' : 'var(--green)' }}>
                                {saldoSelecionado.diasDisponiveis - diasSolicitados} dias
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize:13, color:'var(--text3)', textAlign:'center', padding:'12px 0' }}>
                        {servidor ? 'Nenhum saldo disponível' : 'Selecione um servidor'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}