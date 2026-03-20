'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

type Tab = 'perfil' | 'sistema' | 'notificacoes' | 'seguranca' | 'auditoria'

function Icon({ t }: { t: string }) {
  const p = { stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' }
  switch(t) {
    case 'grid':     return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal':return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':      return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':    return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'file':     return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':   return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':     return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'user':     return <svg {...p} width={16} height={16}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    case 'bell':     return <svg {...p} width={16} height={16}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'shield':   return <svg {...p} width={16} height={16}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'list':     return <svg {...p} width={16} height={16}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    case 'ok':       return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    case 'lock':     return <svg {...p} width={14} height={14}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    case 'eye':      return <svg {...p} width={14} height={14}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'key':      return <svg {...p} width={14} height={14}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
    case 'building': return <svg {...p} width={16} height={16}><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 3v18M16 3v18M2 9h20M2 15h20"/></svg>
    case 'sliders':  return <svg {...p} width={16} height={16}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    default:         return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? '#06224A' : '#e2e8f0',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, paddingRight:24 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--text3)', marginTop:3, lineHeight:1.5 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4, letterSpacing:'-.2px' }}>{title}</div>
      {children}
    </div>
  )
}

export default function ConfiguracoesClient({ user }: { user: any }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('perfil')
  const [toast, setToast] = useState<string | null>(null)

  const isAdmin = user?.role === 'RH' || user?.role === 'ADMIN'

  // perfil
  const [nome, setNome]   = useState(user?.nome || '')
  const [email, setEmail] = useState(user?.email || '')

  // sistema
  const [orgao, setOrgao]     = useState('FCECON')
  const [limiteAcum, setLimiteAcum] = useState('90')
  const [diasExerc, setDiasExerc]   = useState('30')
  const [alertaDias, setAlertaDias] = useState('60')

  // notificações
  const [notifEmail,    setNotifEmail]    = useState(true)
  const [notifAprov,    setNotifAprov]    = useState(true)
  const [notifRisco,    setNotifRisco]    = useState(true)
  const [notifGozo,     setNotifGozo]     = useState(false)
  const [notifRelat,    setNotifRelat]    = useState(false)
  const [notifCadastro, setNotifCadastro] = useState(true)

  // segurança
  const [mfa,      setMfa]      = useState(false)
  const [sessao,   setSessao]   = useState('8')
  const [logLogin, setLogLogin] = useState(true)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key:'perfil',        label:'Minha conta',    icon:'user'     },
    { key:'notificacoes',  label:'Notificações',   icon:'bell'     },
    ...(isAdmin ? [
      { key:'sistema' as Tab,       label:'Sistema Global', icon:'building' },
      { key:'seguranca' as Tab,     label:'Segurança',      icon:'shield'   },
      { key:'auditoria' as Tab,     label:'Auditoria',      icon:'list'     },
    ] : [])
  ]

  const AUDIT_LOG = isAdmin ? [
    { acao:'Login realizado',              usuario: user?.nome,           data:'Hoje, 22:01', ip:'192.168.1.10' },
    { acao:'Solicitação aprovada',         usuario: user?.nome,           data:'Hoje, 18:34', ip:'192.168.1.10' },
    { acao:'Servidor cadastrado',          usuario: user?.nome,           data:'Hoje, 15:22', ip:'192.168.1.10' },
    { acao:'Relatório gerado',             usuario:'Admin',               data:'16/03, 14:11', ip:'192.168.1.5'  },
  ] : []

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
          --amber:#d97706;--amber-bg:#fffbeb;
          --red:#dc2626;--red-bg:#fef2f2;--red-border:#fecaca;
          --blue:#3B7BF6;--blue-bg:#eff6ff;
          --sh:0 1px 3px rgba(0,0,0,.06);
          --r:12px;--r-sm:8px;
        }
        html,body{height:100%;font-family:var(--sans);-webkit-font-smoothing:antialiased;background:var(--surface)}
        .shell{display:flex;height:100vh;overflow:hidden}
        .sidebar{width:232px;min-width:232px;background:var(--navy);display:flex;flex-direction:column;position:relative;overflow-y:auto;overflow-x:hidden}
        .sidebar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,rgba(0,0,0,.18));pointer-events:none}
        .sb-logo{padding:20px 18px 10px;display:flex;align-items:center;gap:10px}
        .sb-section{padding:16px 18px 6px;font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.22)}
        .sb-nav{flex:1;padding:0 10px;overflow-y:auto}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r-sm);color:rgba(255,255,255,.55);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s}
        .nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.8)}
        .nav-item.active{background:rgba(59,123,246,.22);color:#fff}
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

        /* tabs de configurações */
        .cfg-layout{display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:start}
        .cfg-tabs{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh);position:sticky;top:0}
        .cfg-tab{display:flex;align-items:center;gap:10px;padding:11px 14px;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;border-bottom:1px solid var(--border)}
        .cfg-tab:last-child{border-bottom:none}
        .cfg-tab:hover{background:var(--surface);color:var(--text)}
        .cfg-tab.active{background:rgba(6,34,74,.05);color:var(--navy);font-weight:600;border-right:2px solid var(--navy)}

        /* campos */
        .f-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
        .f-field:last-child{margin-bottom:0}
        .f-label{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.1px}
        .f-inp{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--surface);font-family:var(--sans);font-size:13.5px;color:var(--text);outline:none;transition:all .2s}
        .f-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,123,246,.11);background:#fff}
        .f-hint{font-size:11.5px;color:var(--text3);margin-top:2px}
        .f-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}

        /* botões */
        .btn{padding:8px 18px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover{background:var(--navy-mid)}
        .btn.danger{background:var(--red-bg);border-color:var(--red-border);color:var(--red)}
        .btn.danger:hover{background:#fee2e2}
        .save-row{display:flex;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border);margin-top:4px}

        /* audit table */
        .at{width:100%;border-collapse:collapse}
        .at th{padding:9px 14px;font-size:10.5px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:.5px;background:var(--surface2);border-bottom:1px solid var(--border)}
        .at td{padding:10px 14px;font-size:12.5px;color:var(--text2);border-bottom:1px solid var(--border)}
        .at tr:last-child td{border-bottom:none}
        .at tbody tr:hover{background:var(--surface)}
        .bold{font-weight:600;color:var(--text)}
        .mono{font-family:monospace;font-size:11.5px;color:var(--text3)}

        /* senha */
        .pass-field{position:relative}
        .pass-eye{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);padding:2px;display:flex;align-items:center}
        
        .toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:13px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 8px 32px rgba(6,34,74,.3);display:flex;align-items:center;gap:9px;z-index:200;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

        @media(max-width:900px){.cfg-layout{grid-template-columns:1fr}.cfg-tabs{display:flex;overflow-x:auto;position:static}.cfg-tab{border-bottom:none;border-right:1px solid var(--border);white-space:nowrap}.cfg-tab.active{border-right:1px solid var(--border);border-bottom:2px solid var(--navy)}}
        @media(max-width:768px){.sidebar{display:none}}
      `}</style>

      <div className="shell">
        {/* SIDEBAR */}
        <Sidebar variant={isAdmin ? 'admin' : 'servidor'} activeItem="configuracoes" />

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="tb-title">{isAdmin ? 'Configurações Administrativas' : 'Minha Conta'}</div>
            <div className="tb-sub">Personalize o sistema e gerencie sua conta</div>
          </div>

          <div className="content">
            <div className="cfg-layout">

              {/* TABS LATERAIS */}
              <div className="cfg-tabs">
                {TABS.map(t => (
                  <div
                    key={t.key}
                    className={`cfg-tab${tab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    <Icon t={t.icon} />
                    {t.label}
                  </div>
                ))}

                <div className="cfg-tab" onClick={() => signOut({ callbackUrl:'/auth/login' })} style={{ color: 'rgba(220,38,38,.8)', marginTop: 24 }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,38,38,.08)'; e.currentTarget.style.color = 'var(--red)' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,.8)' }}>
                  <Icon t="logout" /> Sair do sistema
                </div>
              </div>

              {/* CONTEÚDO */}
              <div>

                {/* ── PERFIL ── */}
                {tab === 'perfil' && (
                  <>
                    <SectionCard title="Informações do perfil">
                      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:'1px solid var(--border)', marginBottom:14 }}>
                        <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),#6AA3FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0 }}>{user?.nome?.substring(0,2).toUpperCase() || 'CX'}</div>
                        <div>
                          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{user?.nome}</div>
                          <div style={{ fontSize:12.5, color:'var(--text3)', marginTop:2 }}>{user?.email} · {user?.role}</div>
                        </div>
                        <button className="btn" style={{ marginLeft:'auto' }} onClick={() => showToast('Função em desenvolvimento')}>Alterar foto</button>
                      </div>
                      <div className="f-grid">
                        <div className="f-field">
                          <label className="f-label">Nome de exibição</label>
                          <input className="f-inp" value={nome} onChange={e => setNome(e.target.value)} />
                        </div>
                        <div className="f-field">
                          <label className="f-label">E-mail institucional</label>
                          <input className="f-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div className="save-row">
                        <button className="btn navy" onClick={() => showToast('Perfil atualizado com sucesso')}>
                          <Icon t="ok" />Salvar alterações
                        </button>
                      </div>
                    </SectionCard>

                    <SectionCard title="Alterar senha">
                      <div className="f-field">
                        <label className="f-label">Senha atual</label>
                        <div className="pass-field">
                          <input className="f-inp" type="password" placeholder="••••••••" style={{ paddingRight:36 }} />
                          <button type="button" className="pass-eye"><Icon t="eye" /></button>
                        </div>
                      </div>
                      <div className="f-grid">
                        <div className="f-field">
                          <label className="f-label">Nova senha</label>
                          <input className="f-inp" type="password" placeholder="Mínimo 8 caracteres" />
                        </div>
                        <div className="f-field">
                          <label className="f-label">Confirmar nova senha</label>
                          <input className="f-inp" type="password" placeholder="Repita a senha" />
                        </div>
                      </div>
                      <div className="save-row">
                        <button className="btn navy" onClick={() => showToast('Senha alterada com sucesso')}>
                          <Icon t="lock" />Alterar senha
                        </button>
                      </div>
                    </SectionCard>
                  </>
                )}

                {/* ── SISTEMA ── */}
                {isAdmin && tab === 'sistema' && (
                  <>
                    <SectionCard title="Dados da instituição">
                      <div className="f-grid">
                        <div className="f-field">
                          <label className="f-label">Nome do órgão</label>
                          <input className="f-inp" value={orgao} onChange={e => setOrgao(e.target.value)} />
                        </div>
                        <div className="f-field">
                          <label className="f-label">Sigla</label>
                          <input className="f-inp" value="FCECON" readOnly style={{ background:'var(--surface2)', color:'var(--text3)' }} />
                        </div>
                        <div className="f-field" style={{ gridColumn:'1/-1' }}>
                          <label className="f-label">Legislação aplicável</label>
                          <input className="f-inp" value="Lei 1.762/1986 — Estatuto dos Servidores Públicos do Amazonas" readOnly style={{ background:'var(--surface2)', color:'var(--text3)' }} />
                          <span className="f-hint">Definida em conformidade com a legislação estadual vigente</span>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Regras de férias">
                      <div className="f-grid">
                        <div className="f-field">
                          <label className="f-label">Dias por exercício</label>
                          <input className="f-inp" type="number" value={diasExerc} onChange={e => setDiasExerc(e.target.value)} min={1} max={60} />
                          <span className="f-hint">Padrão: 30 dias (Lei 1.762/1986)</span>
                        </div>
                        <div className="f-field">
                          <label className="f-label">Acúmulo máximo (dias)</label>
                          <input className="f-inp" type="number" value={limiteAcum} onChange={e => setLimiteAcum(e.target.value)} min={30} max={180} />
                          <span className="f-hint">Padrão: 90 dias</span>
                        </div>
                        <div className="f-field">
                          <label className="f-label">Alertar com antecedência (dias)</label>
                          <input className="f-inp" type="number" value={alertaDias} onChange={e => setAlertaDias(e.target.value)} min={10} max={120} />
                          <span className="f-hint">Aviso de risco de perda de saldo</span>
                        </div>
                        <div className="f-field">
                          <label className="f-label">Licença especial (anos de serviço)</label>
                          <input className="f-inp" type="number" value="5" readOnly style={{ background:'var(--surface2)', color:'var(--text3)' }} />
                          <span className="f-hint">Definido por lei, não editável</span>
                        </div>
                      </div>
                      <div className="save-row">
                        <button className="btn navy" onClick={() => showToast('Configurações do sistema salvas')}>
                          <Icon t="ok" />Salvar configurações
                        </button>
                      </div>
                    </SectionCard>
                  </>
                )}

                {/* ── NOTIFICAÇÕES ── */}
                {tab === 'notificacoes' && (
                  <SectionCard title="Preferências de notificação">
                    <SettingRow label="Notificações por e-mail" desc="Receber todas as notificações no e-mail cadastrado">
                      <Toggle on={notifEmail} onChange={setNotifEmail} />
                    </SettingRow>
                    {isAdmin && (
                      <SettingRow label="Novas solicitações de aprovação" desc="Aviso quando um servidor solicitar férias ou licença">
                        <Toggle on={notifAprov} onChange={setNotifAprov} />
                      </SettingRow>
                    )}
                    {isAdmin && (
                      <SettingRow label="Alertas de risco de perda" desc={`Servidores com saldo acumulado acima de ${alertaDias} dias`}>
                        <Toggle on={notifRisco} onChange={setNotifRisco} />
                      </SettingRow>
                    )}
                    <SettingRow label="Início e retorno de descanso" desc="Confirmação quando você ou seus geridos entrarem de férias">
                      <Toggle on={notifGozo} onChange={setNotifGozo} />
                    </SettingRow>
                    <div className="save-row">
                      <button className="btn navy" onClick={() => showToast('Preferências de notificação salvas')}>
                        <Icon t="ok" />Salvar preferências
                      </button>
                    </div>
                  </SectionCard>
                )}

                {/* ── SEGURANÇA ── */}
                {isAdmin && tab === 'seguranca' && (
                  <>
                    <SectionCard title="Autenticação">
                      <SettingRow label="Autenticação em dois fatores (MFA)" desc="Exige código via app autenticador além da senha">
                        <Toggle on={mfa} onChange={v => { setMfa(v); showToast(v ? 'MFA ativado' : 'MFA desativado') }} />
                      </SettingRow>
                      <SettingRow label="Registrar tentativas de login" desc="Salva no audit log cada acesso ao sistema">
                        <Toggle on={logLogin} onChange={setLogLogin} />
                      </SettingRow>
                      <SettingRow label="Duração da sessão (horas)" desc="Tempo até o logout automático por inatividade">
                        <select
                          value={sessao}
                          onChange={e => setSessao(e.target.value)}
                          style={{ padding:'7px 12px', border:'1.5px solid var(--border)', borderRadius:8, background:'var(--surface)', fontFamily:'var(--sans)', fontSize:13, color:'var(--text)', outline:'none', cursor:'pointer' }}
                        >
                          {['4','8','12','24'].map(h => <option key={h} value={h}>{h} horas</option>)}
                        </select>
                      </SettingRow>
                      <div className="save-row">
                        <button className="btn navy" onClick={() => showToast('Configurações de segurança salvas')}>
                          <Icon t="ok" />Salvar
                        </button>
                      </div>
                    </SectionCard>
                  </>
                )}

                {/* ── AUDITORIA ── */}
                {isAdmin && tab === 'auditoria' && (
                  <SectionCard title="Log de auditoria do sistema">
                    <table className="at">
                      <thead>
                        <tr><th>Ação</th><th>Usuário</th><th>Data/Hora</th><th>IP</th></tr>
                      </thead>
                      <tbody>
                        {AUDIT_LOG.map((a, i) => (
                          <tr key={i}>
                            <td className="bold">{a.acao}</td>
                            <td>{a.usuario}</td>
                            <td>{a.data}</td>
                            <td className="mono">{a.ip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SectionCard>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast"><Icon t="ok" />{toast}</div>}
    </>
  )
}
