

'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'

// ── tipos ─────────────────────────────────────────────────────
type TipoRelatorio = 'ferias-setor' | 'risco' | 'licencas' | 'geral'

interface RelatorioGerado {
  id: number
  titulo: string
  tipo: TipoRelatorio
  geradoEm: string
  periodo: string
  setor: string
  tamanho: string
}

// ── dados mock ────────────────────────────────────────────────
const HISTORICO: RelatorioGerado[] = [
  { id: 1, titulo: 'Férias — Imagenologia',   tipo: 'ferias-setor', geradoEm: '16/03/2026', periodo: 'Jan–Mar 2026',  setor: 'Imagenologia',      tamanho: '124 KB' },
  { id: 2, titulo: 'Servidores em risco',      tipo: 'risco',        geradoEm: '10/03/2026', periodo: '2025/2026',     setor: 'Todos',             tamanho: '89 KB'  },
  { id: 3, titulo: 'Licenças pendentes',       tipo: 'licencas',     geradoEm: '02/03/2026', periodo: '2025 completo', setor: 'Todos',             tamanho: '201 KB' },
  { id: 4, titulo: 'Férias — Divisão ADM',    tipo: 'ferias-setor', geradoEm: '28/02/2026', periodo: 'Jan–Mar 2026',  setor: 'Divisão ADM',       tamanho: '98 KB'  },
  { id: 5, titulo: 'Relatório geral 2025',     tipo: 'geral',        geradoEm: '15/01/2026', periodo: '2025 completo', setor: 'Todos',             tamanho: '456 KB' },
]

const TIPOS = [
  { value: 'ferias-setor', label: 'Férias por setor'      },
  { value: 'risco',        label: 'Servidores em risco'   },
  { value: 'licencas',     label: 'Licenças especiais'    },
  { value: 'geral',        label: 'Relatório geral'       },
]

const SETORES   = ['Todos', 'Imagenologia', 'Diretoria Técnica', 'Divisão ADM', 'Setor FARP', 'Setor NUTI']
const PERIODOS  = ['Jan–Mar 2026', 'Out–Dez 2025', 'Jul–Set 2025', '2025 completo', '2024 completo', '2025/2026']

function tipoPill(t: TipoRelatorio) {
  if (t === 'risco')        return 'pill wait'
  if (t === 'licencas')     return 'pill blue'
  if (t === 'geral')        return 'pill ok'
  return 'pill'
}

function tipoLabel(t: TipoRelatorio) {
  return TIPOS.find(x => x.value === t)?.label ?? t
}

function NavIcon({ t }: { t: string }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
  switch (t) {
    case 'grid':      return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal': return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':       return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':     return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'file':      return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings':  return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':    return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':      return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'download':  return <svg {...p} width={14} height={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    case 'pdf':       return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM14 13h2M14 16h2"/></svg>
    case 'ok':        return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

// ── preview dinâmico ──────────────────────────────────────────
function PreviewPDF({ tipo, setor, periodo }: { tipo: TipoRelatorio; setor: string; periodo: string }) {
  const titulo = TIPOS.find(t => t.value === tipo)?.label ?? 'Relatório'
  const isRisco = tipo === 'risco'

  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '20px 22px', border: '1px solid #e2e8f0', minHeight: 280, display: 'flex', flexDirection: 'column', gap: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
      {/* cabeçalho do PDF */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid #06224A', paddingBottom: 12, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, background: '#06224A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#06224A', letterSpacing: '.5px', textTransform: 'uppercase' }}>FCECON — Fundação Centro de Controle de Oncologia</div>
          <div style={{ fontSize: 10, color: '#9aa5b4', marginTop: 1 }}>Sistema SISVAC 2.0 · Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      {/* título */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{titulo}</div>
        <div style={{ fontSize: 11, color: '#9aa5b4', marginTop: 3 }}>
          {setor !== 'Todos' ? `Setor: ${setor} · ` : ''}Período: {periodo}
        </div>
      </div>

      {/* linhas simuladas de tabela */}
      <div style={{ background: '#f7f8fc', borderRadius: 4, overflow: 'hidden', marginBottom: 14, border: '1px solid #e2e8f0' }}>
        {/* header da tabela */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, background: '#06224A', padding: '6px 10px' }}>
          {['Servidor', 'Matrícula', 'Saldo', 'Situação'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.5px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {/* linhas */}
        {[
          ['Ana L. Guerreiro', '1032755A', isRisco ? '90d' : '30d', isRisco ? '⚠ Risco' : 'Ativo'],
          ['Fatima K. Oliveira', '0026271A', isRisco ? '90d' : '30d', isRisco ? '⚠ Risco' : 'Ativo'],
          ['Carlos M. Pinheiro', '0071244E', isRisco ? '85d' : '20d', isRisco ? '⚠ Risco' : 'Ativo'],
        ].map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, padding: '5px 10px', borderTop: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f7f8fc' }}>
            {row.map((cell, j) => (
              <div key={j} style={{ fontSize: 10, color: j === 3 && isRisco ? '#d97706' : '#4a5568', fontWeight: j === 0 ? 600 : 400 }}>{cell}</div>
            ))}
          </div>
        ))}
        <div style={{ padding: '5px 10px', borderTop: '1px solid #e2e8f0', background: '#f7f8fc', fontSize: 9, color: '#9aa5b4', fontStyle: 'italic' }}>
          + {Math.floor(Math.random() * 20) + 5} registros adicionais…
        </div>
      </div>

      {/* rodapé com assinaturas */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
        {['Responsável RH', 'Chefia Imediata'].map(label => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ width: 90, height: 1, background: '#cbd5e0', margin: '0 auto' }} />
            <div style={{ fontSize: 9, color: '#9aa5b4', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── componente principal ──────────────────────────────────────
export default function RelatoriosPage() {
  const router = useRouter()
  const [tipo, setTipo]     = useState<TipoRelatorio>('ferias-setor')
  const [setor, setSetor]   = useState('Todos')
  const [periodo, setPeriodo] = useState('Jan–Mar 2026')
  const [gerando, setGerando] = useState(false)
  const [historico, setHistorico] = useState<RelatorioGerado[]>(HISTORICO)
  const [toast, setToast]   = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleGerar() {
    // Para simplificar, transformamos em uma chamada de Impressão local
    // que renderiza um PDF Vectorial limpo aproveitando o navegador Chromium.
    window.print()
    
    // E apenas simula a entrada no histórico (para portfólio)
    const novoRel: RelatorioGerado = {
      id: Date.now(),
      titulo: `${TIPOS.find(t => t.value === tipo)?.label}${setor !== 'Todos' ? ` — ${setor}` : ''}`,
      tipo,
      geradoEm: new Date().toLocaleDateString('pt-BR'),
      periodo,
      setor,
      tamanho: `${Math.floor(Math.random() * 300) + 80} KB`,
    }
    setHistorico(prev => [novoRel, ...prev])
  }

  function handleBaixar(rel: RelatorioGerado) {
    showToast(`Baixando documento...`)
    setTimeout(() => window.print(), 800)
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
          --amber:#d97706;--amber-bg:#fffbeb;
          --red:#dc2626;--red-bg:#fef2f2;
          --blue:#3B7BF6;--blue-bg:#eff6ff;
          --sh:0 1px 3px rgba(0,0,0,.06);--sh-md:0 4px 16px rgba(0,0,0,.1);
          --r:12px;--r-sm:8px;
        }
        html,body{height:100%;font-family:var(--sans);-webkit-font-smoothing:antialiased;background:var(--surface)}
        .shell{display:flex;height:100vh;overflow:hidden}

        /* sidebar */
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

        /* main */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .content{flex:1;overflow-y:auto;padding:24px 28px}

        /* layout duas colunas */
        .rel-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:20px;align-items:start;margin-bottom:28px}
        @media(max-width:960px){.rel-grid{grid-template-columns:1fr}}

        /* card de configuração */
        .config-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:20px;box-shadow:var(--sh)}
        .config-card h4{font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;letter-spacing:-.2px}
        .f-field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
        .f-field:last-of-type{margin-bottom:0}
        .f-label{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.1px}
        .f-inp{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--surface);font-family:var(--sans);font-size:13.5px;color:var(--text);outline:none;transition:all .2s;cursor:pointer}
        .f-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,123,246,.11);background:#fff}

        /* tipo cards */
        .tipo-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
        .tipo-opt{padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:8px}
        .tipo-opt:hover{border-color:var(--border2);background:var(--surface)}
        .tipo-opt.active{border-color:var(--navy);background:rgba(6,34,74,.04)}
        .tipo-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .tipo-opt.active .tipo-dot{background:var(--navy)}
        .tipo-dot{background:var(--border2)}
        .tipo-label{font-size:12.5px;font-weight:500;color:var(--text2)}
        .tipo-opt.active .tipo-label{color:var(--navy);font-weight:600}

        /* preview card */
        .preview-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:20px;box-shadow:var(--sh)}
        .preview-card h4{font-size:14px;font-weight:600;color:var(--text);margin-bottom:14px;letter-spacing:-.2px;display:flex;align-items:center;justify-content:space-between}
        .preview-badge{font-size:11px;font-weight:600;background:var(--surface2);color:var(--text3);padding:3px 9px;border-radius:100px}

        /* ações */
        .config-actions{display:flex;gap:8px;padding-top:16px;border-top:1px solid var(--border);margin-top:16px}
        .btn{padding:9px 18px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn:disabled{opacity:.55;cursor:not-allowed}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover:not(:disabled){background:var(--navy-mid);transform:translateY(-1px);box-shadow:0 4px 12px rgba(6,34,74,.2)}
        .btn.sm{padding:5px 10px;font-size:11.5px}
        .spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* histórico */
        .section-title{font-size:15px;font-weight:600;color:var(--text);letter-spacing:-.2px;margin-bottom:12px}
        .card{background:#fff;border-radius:var(--r);border:1px solid var(--border);box-shadow:var(--sh);overflow:hidden}
        .mt{width:100%;border-collapse:collapse}
        .mt th{padding:9px 16px;font-size:10.5px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:.5px;background:var(--surface2);border-bottom:1px solid var(--border)}
        .mt td{padding:11px 16px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
        .mt tr:last-child td{border-bottom:none}
        .mt tbody tr{transition:background .12s}
        .mt tbody tr:hover{background:var(--surface)}
        .bold{font-weight:600;color:var(--text)}
        .mono{font-size:11.5px;color:var(--text3)}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}

        /* toast */
        .toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:13px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 8px 32px rgba(6,34,74,.3);display:flex;align-items:center;gap:9px;z-index:200;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .toast svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;flex-shrink:0}

        @media(max-width:768px){
          .sidebar{display:none}
          .rel-grid{grid-template-columns:1fr}
        }
        
        /* MAGIC PDF PRINT */
        @media print {
          @page { margin: 1cm; size: A4 portrait; }
          body { background: #fff !important; }
          .sidebar, .topbar, .config-card, .section-title, .card, .toast { display: none !important; }
          .rel-grid { display: block !important; margin: 0 !important; }
          .preview-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          .preview-card h4 { display: none !important; }
          .content { padding: 0 !important; overflow: visible !important; }
          .shell, .main { overflow: visible !important; height: auto !important; }
        }
      `}</style>

      <div className="shell">
        {/* SIDEBAR */}
        <Sidebar variant="admin" activeItem="relatorios" />

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">Relatórios</div>
              <div className="tb-sub">Gere e exporte documentos em PDF</div>
            </div>
            <button className="btn navy" onClick={handleGerar} disabled={gerando}>
              {gerando
                ? <><span className="spinner" />Gerando…</>
                : <><NavIcon t="pdf" />Gerar PDF</>
              }
            </button>
          </div>

          <div className="content">
            <div className="rel-grid">
              {/* COLUNA ESQUERDA — configuração */}
              <div className="config-card">
                <h4>Configurar relatório</h4>

                {/* tipo */}
                <div style={{ marginBottom: 14 }}>
                  <div className="f-label" style={{ marginBottom: 8 }}>Tipo de relatório</div>
                  <div className="tipo-grid">
                    {TIPOS.map(t => (
                      <div
                        key={t.value}
                        className={`tipo-opt${tipo === t.value ? ' active' : ''}`}
                        onClick={() => setTipo(t.value as TipoRelatorio)}
                      >
                        <div className="tipo-dot" />
                        <span className="tipo-label">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* setor */}
                <div className="f-field">
                  <label className="f-label">Setor</label>
                  <select className="f-inp" value={setor} onChange={e => setSetor(e.target.value)}>
                    {SETORES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* período */}
                <div className="f-field">
                  <label className="f-label">Período</label>
                  <select className="f-inp" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                    {PERIODOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div className="config-actions">
                  <button className="btn navy" onClick={handleGerar} disabled={gerando} style={{ flex: 1, justifyContent: 'center' }}>
                    {gerando
                      ? <><span className="spinner" />Gerando PDF…</>
                      : <><NavIcon t="pdf" />Gerar PDF</>
                    }
                  </button>
                </div>
              </div>

              {/* COLUNA DIREITA — preview */}
              <div className="preview-card">
                <h4>
                  Preview
                  <span className="preview-badge">Visualização</span>
                </h4>
                <PreviewPDF tipo={tipo} setor={setor} periodo={periodo} />
              </div>
            </div>

            {/* histórico */}
            <div className="section-title">Gerados recentemente</div>
            <div className="card">
              <table className="mt">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Tipo</th>
                    <th>Gerado em</th>
                    <th>Período</th>
                    <th>Tamanho</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(rel => (
                    <tr key={rel.id}>
                      <td className="bold">{rel.titulo}</td>
                      <td><span className={tipoPill(rel.tipo)}>{tipoLabel(rel.tipo)}</span></td>
                      <td className="mono">{rel.geradoEm}</td>
                      <td>{rel.periodo}</td>
                      <td className="mono">{rel.tamanho}</td>
                      <td>
                        <button className="btn sm" onClick={() => handleBaixar(rel)}>
                          <NavIcon t="download" />Baixar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="toast">
          <NavIcon t="ok" />
          {toast}
        </div>
      )}
    </>
  )
}
