'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import { editarServidorAction } from './actions'
import type { ServidorDetalhe, ServidorSolicitacao } from '@/lib/queries/servidores'

function pillSituacao(s: string) {
  if (s === 'Ativo')       return 'pill ok'
  if (s === 'Em descanso')     return 'pill blue'
  if (s === 'Risco perda') return 'pill wait'
  return 'pill no'
}

function pillStatus(s: string) {
  if (s === 'Aprovado')  return 'pill ok'
  if (s === 'Pendente')  return 'pill wait'
  if (s === 'Em descanso')   return 'pill blue'
  if (s === 'Reprovado') return 'pill no'
  return 'pill'
}

function saldoBarColor(dias: number) {
  if (dias >= 75) return 'full'
  if (dias >= 45) return 'warn'
  return ''
}

function Icon({ t }: { t: string }) {
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
    case 'back':      return <svg {...p} width={14} height={14}><polyline points="15,18 9,12 15,6"/></svg>
    case 'plus':      return <svg {...p} width={14} height={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'warn':      return <svg {...p} width={14} height={14}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'mail':      return <svg {...p} width={14} height={14}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
    case 'shield':    return <svg {...p} width={14} height={14}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'ok':        return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    case 'edit':      return <svg {...p} width={14} height={14}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  servidor: ServidorDetalhe
  historico: ServidorSolicitacao[]
  idServidor: string
}

export default function ServidorDetalheClient({ servidor, historico, idServidor }: Props) {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  
  // Modal Edit State
  const [modalOpen, setModalOpen] = useState(false)
  const [editNome, setEditNome]   = useState(servidor.nome)
  const [editCargo, setEditCargo] = useState(servidor.cargo)
  const [editSetor, setEditSetor] = useState(servidor.setor)
  const [isSaving, setIsSaving]   = useState(false)
  
  const iniciais = servidor.nome.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('')
  const anos = servidor.admissao
    ? Math.floor((Date.now() - new Date(servidor.admissao.split('/').reverse().join('-')).getTime()) / (365.25 * 24 * 3600 * 1000))
    : 0

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    const res = await editarServidorAction(idServidor, editNome, editCargo, editSetor)
    setIsSaving(false)
    if (res.ok) {
      setModalOpen(false)
      showToast('Servidor atualizado com sucesso!')
    } else {
      showToast(res.error ?? 'Erro ao salvar')
    }
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
        .sb-user{position:relative;z-index:1;margin:8px 10px 12px;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:10px;display:flex;align-items:center;gap:9px}
        .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .su-name{font-size:12.5px;font-weight:600;color:#fff}
        .su-role{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0}
        .tb-back{width:32px;height:32px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);transition:all .15s;flex-shrink:0}
        .tb-back:hover{background:var(--surface);border-color:var(--border2)}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .det-layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
        @media(max-width:1000px){.det-layout{grid-template-columns:1fr}}
        .alert-risco{display:flex;align-items:center;gap:10px;background:var(--white);border:1px solid var(--amber-border);border-radius:var(--r);padding:12px 16px;margin-bottom:16px;box-shadow:var(--sh)}
        .alert-risco strong{font-size:13px;font-weight:600;color:var(--text)}
        .alert-risco p{font-size:12px;color:var(--text3);margin-top:1px}
        .section-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:20px;margin-bottom:16px;box-shadow:var(--sh)}
        .section-card h4{font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;letter-spacing:-.2px}
        .hero-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:22px 24px;margin-bottom:16px;box-shadow:var(--sh);display:flex;align-items:center;gap:18px}
        .hero-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0}
        .hero-nome{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px;margin-bottom:2px}
        .hero-cargo{font-size:13px;color:var(--text2);margin-bottom:8px}
        .hero-badges{display:flex;gap:8px;flex-wrap:wrap}
        .hero-actions{margin-left:auto;display:flex;gap:8px;flex-shrink:0}
        .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .meta-box{background:var(--surface);padding:11px 13px;border-radius:var(--r-sm)}
        .meta-lbl{font-size:10.5px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.4px}
        .meta-val{font-size:13.5px;font-weight:600;color:var(--text);margin-top:3px}
        .saldo-row{padding:10px 0;border-bottom:1px solid var(--border)}
        .saldo-row:last-child{border-bottom:none;padding-bottom:0}
        .saldo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .saldo-lbl{font-size:12.5px;color:var(--text2);font-weight:500}
        .saldo-val{font-family:var(--serif);font-size:16px;color:var(--text)}
        .prog{background:var(--surface2);border-radius:100px;height:5px;overflow:hidden}
        .prog-fill{height:100%;border-radius:100px;background:var(--accent);transition:width .5s ease}
        .prog-fill.warn{background:var(--amber)}
        .prog-fill.full{background:var(--red)}
        .mt{width:100%;border-collapse:collapse}
        .mt th{padding:9px 14px;font-size:10.5px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:.5px;background:var(--surface2);border-bottom:1px solid var(--border)}
        .mt td{padding:11px 14px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
        .mt tr:last-child td{border-bottom:none}
        .mt tbody tr:hover{background:var(--surface)}
        .bold{font-weight:600;color:var(--text)}
        .mono{font-family:monospace;font-size:11.5px;color:var(--text3)}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)}
        .card-head h4{font-size:14px;font-weight:600;color:var(--text);letter-spacing:-.2px;margin:0}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.no{background:var(--red-bg);color:var(--red)}.pill.no::before{background:var(--red)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}
        .btn{padding:8px 16px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover{background:var(--navy-mid)}
        .btn.danger{background:var(--red-bg);border-color:var(--red-border);color:var(--red)}
        .btn.danger:hover{background:#fee2e2}
        .empty-hist{padding:28px;text-align:center;font-size:13px;color:var(--text3)}
        .toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:13px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 8px 32px rgba(6,34,74,.3);display:flex;align-items:center;gap:9px;z-index:200;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .modal-overlay{position:fixed;inset:0;background:rgba(6,34,74,.4);backdrop-filter:blur(4px);z-index:900;display:flex;align-items:center;justify-content:center;animation:fade .2s}
        .modal-card{background:#fff;border-radius:var(--r);width:100%;max-width:440px;box-shadow:0 24px 48px rgba(0,0,0,.15);animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
        .modal-head{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
        .modal-head h3{font-size:16px;font-weight:600;color:var(--text);letter-spacing:-.2px}
        .modal-close{background:none;border:none;font-size:20px;color:var(--text3);cursor:pointer;line-height:1;transition:color .2s}
        .modal-close:hover{color:var(--red)}
        .modal-body{padding:24px}
        .inp-g{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
        .inp-g label{font-size:12.5px;font-weight:600;color:var(--text2)}
        .inp-g input{padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-size:13.5px;color:var(--text);outline:none;background:var(--surface);transition:all .2s}
        .inp-g input:focus{border-color:var(--accent);background:#fff}
        .modal-foot{padding:20px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:var(--surface2);border-radius:0 0 var(--r) var(--r)}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:none}}
        @media(max-width:768px){.sidebar{display:none}.meta-grid{grid-template-columns:1fr}.hero-actions{display:none}}
      `}</style>

      <div className="shell">
        <Sidebar variant="admin" activeItem="servidores" />

        <div className="main">
          <div className="topbar">
            <div className="tb-back" onClick={() => router.push('/servidores')}><Icon t="back" /></div>
            <div style={{ flex:1 }}>
              <div className="tb-title">{servidor.nome}</div>
              <div className="tb-sub">{servidor.matricula} · {servidor.setor}</div>
            </div>
            <button className="btn navy" onClick={() => router.push('/ferias?servidor=' + idServidor)}>
              <Icon t="plus" />Nova solicitação
            </button>
          </div>

          <div className="content">
            {servidor.emRisco && (
              <div className="alert-risco">
                <div style={{ width:32, height:32, background:'var(--amber-bg)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--amber)' }}>
                  <Icon t="warn" />
                </div>
                <div>
                  <strong>Servidor em risco de perda de férias</strong>
                  <p>Saldo acumulado: {servidor.saldoFerias} dias. Recomenda-se solicitar férias imediatamente.</p>
                </div>
                <button className="btn" style={{ marginLeft:'auto', flexShrink:0 }} onClick={() => router.push('/ferias?servidor=' + idServidor)}>
                  Solicitar agora
                </button>
              </div>
            )}

            <div className="det-layout">
              {/* COLUNA PRINCIPAL */}
              <div>
                {/* Hero */}
                <div className="hero-card">
                  <div className="hero-avatar">{iniciais}</div>
                  <div>
                    <div className="hero-nome">{servidor.nome}</div>
                    <div className="hero-cargo">{servidor.cargo} · {servidor.orgao}</div>
                    <div className="hero-badges">
                      <span className={pillSituacao(servidor.situacao)}>{servidor.situacao}</span>
                      <span className="pill" style={{ background:'var(--surface2)', color:'var(--text2)' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--text3)', flexShrink:0 }}/>
                        {servidor.vinculo}
                      </span>
                      {servidor.saldoLicenca > 0 && <span className="pill ok">Licença especial elegível</span>}
                    </div>
                  </div>
                  <div className="hero-actions">
                    <button className="btn" onClick={() => setModalOpen(true)}><Icon t="edit" />Editar</button>
                    <button className="btn navy" onClick={() => router.push('/ferias?servidor=' + idServidor)}><Icon t="plus" />Solicitar férias</button>
                  </div>
                </div>

                {/* Dados funcionais */}
                <div className="section-card">
                  <h4>Dados funcionais</h4>
                  <div className="meta-grid">
                    <div className="meta-box">
                      <div className="meta-lbl">Matrícula</div>
                      <div className="meta-val" style={{ fontFamily:'monospace', fontSize:14 }}>{servidor.matricula}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Cargo</div>
                      <div className="meta-val">{servidor.cargo}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Setor</div>
                      <div className="meta-val">{servidor.setor}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Órgão</div>
                      <div className="meta-val">{servidor.orgao}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Vínculo</div>
                      <div className="meta-val">{servidor.vinculo}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Admissão</div>
                      <div className="meta-val">{servidor.admissao}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">Anos de serviço</div>
                      <div className="meta-val">{anos} anos</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-lbl">CPF</div>
                      <div className="meta-val" style={{ fontSize:13 }}>
                        {servidor.cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Histórico */}
                <div className="section-card" style={{ padding:0, overflow:'hidden' }}>
                  <div className="card-head">
                    <h4>Histórico de férias</h4>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>{historico.length} registro{historico.length !== 1 ? 's' : ''}</span>
                  </div>
                  {historico.length === 0 ? (
                    <div className="empty-hist">Nenhuma solicitação registrada para este servidor.</div>
                  ) : (
                    <table className="mt">
                      <thead>
                        <tr><th>Tipo</th><th>Período</th><th>Dias</th><th>Exercício</th><th>Data</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {historico.map(h => (
                          <tr key={h.id}>
                            <td className="bold">{h.tipo}</td>
                            <td>{h.periodo}</td>
                            <td>{h.dias}d</td>
                            <td>{h.exercicio}</td>
                            <td>{h.criadoEm}</td>
                            <td><span className={pillStatus(h.status)}>{h.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* COLUNA DIREITA */}
              <div>
                <div className="section-card">
                  <h4>Saldo de férias</h4>
                  <div className="saldo-row">
                    <div className="saldo-top">
                      <span className="saldo-lbl">Total disponível</span>
                      <span className="saldo-val">{servidor.saldoFerias} dias</span>
                    </div>
                    <div className="prog">
                      <div className={`prog-fill ${saldoBarColor(servidor.saldoFerias)}`}
                        style={{ width:`${Math.min((servidor.saldoFerias/90)*100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="saldo-row">
                    <div className="saldo-top">
                      <span className="saldo-lbl">Acumulado</span>
                      <span className="saldo-val">{servidor.saldoFerias} / 90</span>
                    </div>
                    <div className="prog">
                      <div className={`prog-fill ${saldoBarColor(servidor.saldoFerias)}`}
                        style={{ width:`${Math.round((servidor.saldoFerias/90)*100)}%` }} />
                    </div>
                  </div>
                  <div className="saldo-row">
                    <div className="saldo-top">
                      <span className="saldo-lbl">Licença especial</span>
                      <span className="saldo-val" style={{ fontSize:13, color: servidor.saldoLicenca > 0 ? 'var(--green)' : 'var(--text3)' }}>
                        {servidor.saldoLicenca > 0 ? `${servidor.saldoLicenca} dias` : 'Indisponível'}
                      </span>
                    </div>
                    {servidor.saldoLicenca > 0 && (
                      <div style={{ fontSize:11.5, color:'var(--green)', marginTop:4 }}>✓ Elegível — {anos} anos de serviço</div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="section-card">
                  <h4>Ações rápidas</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button className="btn navy" style={{ justifyContent:'center' }} onClick={() => router.push('/ferias?servidor=' + idServidor)}>
                      <Icon t="plus" />Solicitar férias
                    </button>
                    <button className="btn" style={{ justifyContent:'center' }} onClick={() => {
                      const aprovada = historico.find(h => ['Aprovado', 'Em descanso'].includes(h.status));
                      if (aprovada) window.open(`/api/guia/${aprovada.id}`, '_blank');
                      else showToast('Nenhuma solicitação aprovada encontrada');
                    }}>
                      <Icon t="file" />Emitir guia de férias
                    </button>
                    <button className="btn" style={{ justifyContent:'center' }} onClick={() => showToast(`E-mail enviado`)}>
                      <Icon t="mail" />Enviar notificação
                    </button>
                    <button className="btn danger" style={{ justifyContent:'center' }} onClick={() => showToast('Ação registrada no audit log')}>
                      Inativar servidor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !isSaving && setModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Editar Servidor</h3>
              {!isSaving && <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>}
            </div>
            <form onSubmit={handleSalvarEdicao}>
              <div className="modal-body">
                <div className="inp-g">
                  <label>Nome Completo</label>
                  <input required value={editNome} onChange={e => setEditNome(e.target.value)} disabled={isSaving} />
                </div>
                <div className="inp-g">
                  <label>Cargo</label>
                  <input required value={editCargo} onChange={e => setEditCargo(e.target.value)} disabled={isSaving} />
                </div>
                <div className="inp-g" style={{ marginBottom:0 }}>
                  <label>Setor</label>
                  <input required value={editSetor} onChange={e => setEditSetor(e.target.value)} disabled={isSaving} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn" onClick={() => setModalOpen(false)} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="btn navy" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast"><Icon t="ok" />{toast}</div>
      )}
    </>
  )
}