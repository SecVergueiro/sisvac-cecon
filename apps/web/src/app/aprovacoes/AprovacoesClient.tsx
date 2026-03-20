'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import { aprovarAction, negarAction } from './actions'
import type { SolicitacaoPendente, SolicitacaoHistorico } from '@/lib/queries/aprovacoes'

function pillClass(s: string) {
  if (s === 'Aprovado')  return 'pill ok'
  if (s === 'Pendente')  return 'pill wait'
  if (s === 'Em descanso')   return 'pill blue'
  if (s === 'Reprovado') return 'pill no'
  return 'pill'
}

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
    case 'ok':        return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    case 'x':         return <svg {...p} width={14} height={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  pendentes: SolicitacaoPendente[]
  historico: SolicitacaoHistorico[]
}

export default function AprovacoesClient({ pendentes: initialPendentes, historico: initialHistorico }: Props) {
  const router = useRouter()
  const [pendentes, setPendentes]   = useState(initialPendentes)
  const [historico, setHistorico]   = useState(initialHistorico)
  const [saindo, setSaindo]         = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aprovar' | 'negar' } | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [toast, setToast]           = useState<{ msg: string; tipo: 'ok' | 'no' } | null>(null)
  const [isPending, startTransition] = useTransition()

  function showToast(msg: string, tipo: 'ok' | 'no') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  function confirmarAcao() {
    if (!confirmando) return
    const { id, acao } = confirmando
    const item = pendentes.find(p => p.id === id)
    if (!item) return

    setConfirmando(null)

    startTransition(async () => {
      // Otimistic UI — remove imediatamente
      setSaindo(id)
      await new Promise(r => setTimeout(r, 350))
      setPendentes(prev => prev.filter(p => p.id !== id))
      setSaindo(null)

      // Chama a Server Action
      const result = acao === 'aprovar'
        ? await aprovarAction(id)
        : await negarAction(id, justificativa || undefined)

      if (result.ok) {
        // Adiciona ao histórico local
        setHistorico(prev => [{
          id,
          nome:       item.nome,
          matricula:  item.matricula,
          periodo:    item.periodo,
          dias:       item.dias,
          status:     acao === 'aprovar' ? 'Aprovado' : 'Reprovado',
          aprovadoPor: acao === 'aprovar' ? 'Gestor RH' : null,
          negadoPor:   acao === 'negar'   ? 'Gestor RH' : null,
          data:       new Date().toLocaleDateString('pt-BR'),
        }, ...prev])
        showToast(
          acao === 'aprovar'
            ? `Férias de ${item.nome.split(' ')[0]} aprovadas`
            : `Solicitação de ${item.nome.split(' ')[0]} negada`,
          acao === 'aprovar' ? 'ok' : 'no'
        )
        setJustificativa('')
        router.refresh()
      } else {
        // Reverte se falhou
        setPendentes(prev => [item, ...prev])
        showToast(`Erro: ${result.error || 'Tente novamente'}`, 'no')
      }
    })
  }

  const item = confirmando ? pendentes.find(p => p.id === confirmando.id) : null
  const isAprovar = confirmando?.acao === 'aprovar'

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
          --amber:#d97706;--amber-bg:#fffbeb;
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
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .page-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .page-head h2{font-size:16px;font-weight:600;color:var(--text);letter-spacing:-.2px}
        .page-head p{font-size:12.5px;color:var(--text3);margin-top:3px}
        .card{background:#fff;border-radius:var(--r);border:1px solid var(--border);box-shadow:var(--sh);margin-bottom:20px;overflow:hidden}
        .aprov-list{display:flex;flex-direction:column}
        .aprov-item{display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border);transition:background .15s,opacity .35s,transform .35s,max-height .35s;overflow:hidden;max-height:200px}
        .aprov-item:last-child{border-bottom:none}
        .aprov-item:hover{background:var(--surface)}
        .aprov-item.saindo{opacity:0;transform:translateX(32px);max-height:0;padding-top:0;padding-bottom:0;border-bottom-width:0}
        .aprov-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#c7d9f7,#e8f0fd);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--navy-mid);flex-shrink:0;letter-spacing:.5px}
        .aprov-info{flex:1;min-width:0}
        .aprov-name{font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px}
        .aprov-meta{font-size:12px;color:var(--text3)}
        .aprov-tag{display:inline-flex;align-items:center;background:var(--amber-bg);color:var(--amber);font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px;margin-top:6px}
        .aprov-tag.licenca{background:rgba(124,58,237,.08);color:#7C3AED}
        .aprov-dias{text-align:center;flex-shrink:0;width:48px}
        .aprov-dias-num{font-family:var(--serif);font-size:26px;color:var(--text);letter-spacing:-1px;line-height:1}
        .aprov-dias-lbl{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
        .aprov-actions{display:flex;gap:8px;flex-shrink:0}
        .btn{padding:7px 14px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn.success{background:var(--green-bg);border-color:var(--green-border);color:var(--green);font-weight:600}
        .btn.success:hover{background:#dcfce7}
        .btn.danger{background:var(--red-bg);border-color:var(--red-border);color:var(--red);font-weight:600}
        .btn.danger:hover{background:#fee2e2}
        .empty{padding:48px 20px;text-align:center}
        .empty-icon{width:48px;height:48px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:var(--green)}
        .empty-icon svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
        .empty h3{font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px}
        .empty p{font-size:13px;color:var(--text3)}
        .section-title{font-size:15px;font-weight:600;color:var(--text);letter-spacing:-.2px;margin-bottom:12px}
        .mt{width:100%;border-collapse:collapse}
        .mt th{padding:8px 18px;font-size:11px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:.5px;background:var(--surface);border-bottom:1px solid var(--border)}
        .mt td{padding:10px 18px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
        .mt tr:last-child td{border-bottom:none}
        .mt tbody tr:hover{background:var(--surface)}
        .bold{font-weight:600;color:var(--text)}
        .mono{font-family:monospace;font-size:12px;color:var(--text3)}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.no{background:var(--red-bg);color:var(--red)}.pill.no::before{background:var(--red)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fadeIn .18s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal{background:#fff;border-radius:16px;padding:28px;width:420px;max-width:90vw;box-shadow:var(--sh-md);animation:slideUp .2s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .modal-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .modal-icon.ok{background:var(--green-bg);color:var(--green)}
        .modal-icon.no{background:var(--red-bg);color:var(--red)}
        .modal-icon svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
        .modal h3{font-size:16px;font-weight:600;color:var(--text);margin-bottom:6px}
        .modal p{font-size:13.5px;color:var(--text2);line-height:1.6;margin-bottom:16px}
        .modal textarea{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:var(--sans);font-size:13px;color:var(--text);outline:none;resize:vertical;min-height:72px;margin-bottom:16px;transition:border-color .2s}
        .modal textarea:focus{border-color:var(--red)}
        .modal-actions{display:flex;gap:8px;justify-content:flex-end}
        .toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:13px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 8px 32px rgba(6,34,74,.3);display:flex;align-items:center;gap:9px;z-index:200;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .toast.no{background:#1a1a2e}
        @media(max-width:768px){.sidebar{display:none}.aprov-actions{flex-direction:column}}
      `}</style>

      <div className="shell">
        <Sidebar variant="admin" activeItem="aprovacoes" pendentesCount={pendentes.length} />

        <div className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">Aprovações</div>
              <div className="tb-sub">{pendentes.length} pedido{pendentes.length !== 1 ? 's' : ''} aguardando análise</div>
            </div>
          </div>

          <div className="content">
            <div className="page-head">
              <div>
                <h2>Solicitações pendentes</h2>
                <p>{pendentes.length} pedido{pendentes.length !== 1 ? 's' : ''} aguardando análise</p>
              </div>
            </div>

            <div className="card">
              {pendentes.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
                  </div>
                  <h3>Tudo em dia!</h3>
                  <p>Nenhuma solicitação aguardando aprovação.</p>
                </div>
              ) : (
                <div className="aprov-list">
                  {pendentes.map(item => (
                    <div key={item.id} className={`aprov-item${saindo === item.id ? ' saindo' : ''}`}>
                      <div className="aprov-avatar">
                        {item.nome.split(' ').filter(Boolean).slice(0,2).map((n:string) => n[0]).join('')}
                      </div>
                      <div className="aprov-info">
                        <div className="aprov-name">{item.nome}</div>
                        <div className="aprov-meta">{item.matricula} · {item.setor} · Solicitado {item.criadoEm}</div>
                        <span className={`aprov-tag${item.tipo.includes('Licença') ? ' licenca' : ''}`}>
                          {item.tipo}{item.fracionamento !== 'Integral' ? ` ${item.fracionamento}` : ''} · {item.periodo}
                        </span>
                      </div>
                      <div className="aprov-dias">
                        <div className="aprov-dias-num">{item.dias}</div>
                        <div className="aprov-dias-lbl">dias</div>
                      </div>
                      <div className="aprov-actions" onClick={e => e.stopPropagation()}>
                        <button
                          className="btn danger"
                          disabled={isPending}
                          onClick={() => setConfirmando({ id: item.id, acao: 'negar' })}
                        >
                          <NavIcon t="x" />Negar
                        </button>
                        <button
                          className="btn success"
                          disabled={isPending}
                          onClick={() => setConfirmando({ id: item.id, acao: 'aprovar' })}
                        >
                          <NavIcon t="ok" />Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-title">Histórico recente</div>
            <div className="card">
              {historico.length === 0 ? (
                <div style={{ padding:'24px 18px', textAlign:'center', fontSize:13, color:'var(--text3)' }}>
                  Nenhum histórico ainda.
                </div>
              ) : (
                <table className="mt">
                  <thead>
                    <tr><th>Servidor</th><th>Matrícula</th><th>Período</th><th>Dias</th><th>Status</th><th>Data</th></tr>
                  </thead>
                  <tbody>
                    {historico.map(h => (
                      <tr key={h.id}>
                        <td className="bold">{h.nome}</td>
                        <td className="mono">{h.matricula}</td>
                        <td>{h.periodo}</td>
                        <td>{h.dias}d</td>
                        <td><span className={pillClass(h.status)}>{h.status}</span></td>
                        <td>{h.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {confirmando && item && (
        <div className="modal-overlay" onClick={() => setConfirmando(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${isAprovar ? 'ok' : 'no'}`}>
              <svg viewBox="0 0 24 24">
                {isAprovar
                  ? <polyline points="20,6 9,17 4,12"/>
                  : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                }
              </svg>
            </div>
            <h3>{isAprovar ? 'Aprovar solicitação?' : 'Negar solicitação?'}</h3>
            <p>
              {isAprovar
                ? `Confirmar aprovação de ${item.dias} dias de ${item.tipo.toLowerCase()} para ${item.nome}?`
                : `Informe o motivo da negação para ${item.nome}.`
              }
            </p>
            {!isAprovar && (
              <textarea
                placeholder="Justificativa (opcional)…"
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
              />
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmando(null)}>Cancelar</button>
              <button
                className={`btn ${isAprovar ? 'success' : 'danger'}`}
                onClick={confirmarAcao}
                disabled={isPending}
              >
                {isAprovar ? 'Sim, aprovar' : 'Sim, negar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.tipo === 'no' ? 'no' : ''}`}>
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {toast.tipo === 'ok'
              ? <polyline points="20,6 9,17 4,12"/>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            }
          </svg>
          {toast.msg}
        </div>
      )}
    </>
  )
}