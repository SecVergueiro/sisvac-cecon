'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { solicitarFeriasServidorAction } from './actions'
import type { MeuPerfil, MeuSaldo, MinhaSolicitacao } from '@/lib/queries/meu-painel'

type Tab = 'inicio' | 'historico' | 'perfil' | 'solicitar'

function pillStatus(s: string) {
  if (s === 'Aprovado')  return 'pill ok'
  if (s === 'Pendente')  return 'pill wait'
  if (s === 'Em descanso')   return 'pill blue'
  if (s === 'Reprovado') return 'pill no'
  if (s === 'Cancelado') return 'pill no'
  return 'pill'
}

function saldoColor(dias: number, max: number) {
  const pct = (dias / max) * 100
  if (pct >= 80) return 'full'
  if (pct >= 50) return 'warn'
  return ''
}

function Icon({ t }: { t: string }) {
  const p = { stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' }
  switch(t) {
    case 'home':    return <svg {...p} width={16} height={16}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
    case 'history': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
    case 'user':    return <svg {...p} width={16} height={16}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    case 'logout':  return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'plus':    return <svg {...p} width={14} height={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'warn':    return <svg {...p} width={14} height={14}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'chevron': return <svg {...p} width={14} height={14}><polyline points="9,18 15,12 9,6"/></svg>
    case 'ok':      return <svg {...p} width={12} height={12}><polyline points="20,6 9,17 4,12"/></svg>
    case 'cal':     return <svg {...p} width={14} height={14}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'send':    return <svg {...p} width={15} height={15}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
    case 'file':    return <svg {...p} width={15} height={15}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings':return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    default:        return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

function timelineStatus(status: string) {
  const steps = ['Criada', 'Análise RH', 'Aprovação chefia', 'Guia emitida']
  const doneMap: Record<string, number> = {
    'Pendente':  1,
    'Em descanso':   3,
    'Aprovado':  3,
    'Reprovado': 1,
    'Cancelado': 1,
  }
  const done = doneMap[status] ?? 1
  return steps.map((label, i) => ({
    label,
    estado: i < done ? 'done' : i === done ? 'now' : 'idle' as 'done' | 'now' | 'idle',
  }))
}

interface Props {
  perfil: MeuPerfil
  saldos: MeuSaldo[]
  solicitacoes: MinhaSolicitacao[]
}

const FRACOS = [
  { key: 'INTEGRAL',      label: 'Integral (30d)', dias: 30 },
  { key: 'QUINZE_QUINZE', label: '15 + 15',        dias: 15 },
  { key: 'DEZ_VINTE',     label: '10 + 20',        dias: 10 },
  { key: 'DEZ_DEZ_DEZ',   label: '10 + 10 + 10',   dias: 10 },
]

export default function MeuPainelClient({ perfil, saldos, solicitacoes }: Props) {
  const router  = useRouter()
  const [tab, setTab]           = useState<Tab>('inicio')
  const [expandido, setExpandido] = useState<string | null>(solicitacoes[0]?.id ?? null)

  // Form de solicitação
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo]             = useState<'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'>('FERIAS_INTEGRAL')
  const [fracao, setFracao]         = useState<'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'>('INTEGRAL')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [obs, setObs]               = useState('')
  const [saldoId, setSaldoId]       = useState<string>(saldos[0]?.exercicio ?? '')
  const [enviado, setEnviado]       = useState(false)
  const [erro, setErro]             = useState('')

  const iniciais = perfil.nome.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('')
  const saldoTotal = saldos.reduce((acc, s) => acc + s.diasDisponiveis, 0)
  const emRisco    = saldos.some(s => s.emRisco)
  const pendentes  = solicitacoes.filter(s => s.status === 'Pendente' || s.status === 'Em descanso')
  const hora       = new Date().getHours()
  const saudacao   = hora < 5 ? 'Boa noite' : hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const anos = perfil.admissao
    ? Math.floor((Date.now() - new Date(perfil.admissao.split('/').reverse().join('-')).getTime()) / (365.25 * 24 * 3600 * 1000))
    : 0

  const diasSolicitados = dataInicio && dataFim
    ? Math.max(0, Math.round((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000) + 1)
    : 0

  useEffect(() => {
    if (!dataInicio) return
    const d = new Date(dataInicio)
    const dias = tipo === 'LICENCA_ESPECIAL' ? 90
      : tipo === 'FERIAS_INTEGRAL' ? 30
      : FRACOS.find(f => f.key === fracao)?.dias ?? 30
    d.setDate(d.getDate() + dias - 1)
    setDataFim(d.toISOString().split('T')[0])
  }, [dataInicio, fracao, tipo])

  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault()
    if (!dataInicio || !dataFim || !saldoId) return
    setErro('')
    startTransition(async () => {
      const res = await solicitarFeriasServidorAction({
        exercicio: saldoId,
        tipoAfastamento: tipo,
        tipoFracionamento: fracao,
        dataInicio,
        dataFim,
        diasSolicitados,
        observacoes: obs
      })
      if (res.ok) {
        setEnviado(true)
        setObs('')
      } else {
        setErro(res.error ?? 'Erro desconhecido')
      }
    })
  }

  function resetar() {
    setEnviado(false); setDataInicio(''); setDataFim(''); setErro('');
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
        .sidebar{width:220px;min-width:220px;background:var(--navy);display:flex;flex-direction:column;position:relative}
        .sidebar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,rgba(0,0,0,.18));pointer-events:none}
        .sb-logo{padding:20px 18px 10px;display:flex;align-items:center;justify-content:center}
        .sb-profile{margin:6px 12px 16px;padding:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px}
        .sb-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;margin-bottom:10px}
        .sb-nome{font-size:13px;font-weight:600;color:#fff;line-height:1.3;margin-bottom:2px}
        .sb-cargo{font-size:11px;color:rgba(255,255,255,.45);line-height:1.4}
        .sb-mat{font-size:10.5px;color:rgba(255,255,255,.3);margin-top:4px;font-family:monospace}
        .sb-section{padding:12px 18px 6px;font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.22)}
        .sb-nav{flex:1;padding:0 10px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r-sm);color:rgba(255,255,255,.55);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s}
        .nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.8)}
        .nav-item.active{background:rgba(59,123,246,.22);color:#fff}
        .nb{margin-left:auto;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:100px}
        .sb-bottom{padding:0 10px 12px;position:relative;z-index:1}
        .nav-item.logout{color:rgba(255,255,255,.4)}
        .nav-item.logout:hover{color:rgba(255,255,255,.7);background:rgba(220,38,38,.15)}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .topbar{padding:16px 28px;background:var(--white);border-bottom:1px solid var(--border);flex-shrink:0}
        .tb-title{font-size:17px;font-weight:600;color:var(--text);letter-spacing:-.3px}
        .tb-sub{font-size:12.5px;color:var(--text3);margin-top:2px}
        .content{flex:1;overflow-y:auto;padding:24px 28px}
        .hero{background:var(--navy);border-radius:var(--r);padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;background:rgba(255,255,255,.04);border-radius:50%}
        .hero-greeting{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:4px}
        .hero-nome{font-family:var(--serif);font-size:24px;color:#fff;margin-bottom:2px;letter-spacing:-.3px}
        .hero-cargo{font-size:13px;color:rgba(255,255,255,.55);margin-bottom:20px}
        .hero-stats{display:flex;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden;width:fit-content}
        .hero-stat{padding:12px 20px;border-right:1px solid rgba(255,255,255,.08)}
        .hero-stat:last-child{border-right:none}
        .hero-stat-val{font-family:var(--serif);font-size:22px;color:#fff;letter-spacing:-1px;display:block}
        .hero-stat-lbl{font-size:10.5px;color:rgba(255,255,255,.38);text-transform:uppercase;display:block;margin-top:2px}
        .two-col{display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start}
        @media(max-width:1000px){.two-col{grid-template-columns:1fr}}
        .section-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:12px;letter-spacing:-.2px}
        .alert-warn{display:flex;align-items:center;gap:10px;background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:var(--r-sm);padding:12px 14px;margin-bottom:14px;font-size:12.5px;color:var(--amber)}
        .cta-card{background:linear-gradient(135deg,var(--navy),var(--navy-mid));border-radius:var(--r);padding:18px;margin-bottom:14px;cursor:pointer;transition:transform .2s,box-shadow .2s;display:flex;align-items:center;gap:14px}
        .cta-card:hover{transform:translateY(-2px);box-shadow:var(--sh-md)}
        .cta-icon{width:38px;height:38px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
        .cta-title{font-size:14px;font-weight:600;color:#fff}
        .cta-sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px}
        .pendente-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:14px}
        .pendente-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;transition:background .15s}
        .pendente-head:hover{background:var(--surface)}
        .pendente-head-left{display:flex;align-items:center;gap:12px}
        .pendente-tipo{font-size:13.5px;font-weight:600;color:var(--text)}
        .pendente-meta{font-size:12px;color:var(--text3);margin-top:2px}
        .pendente-body{padding:0 16px 16px;border-top:1px solid var(--border)}
        .tl{display:flex;flex-direction:column;padding-top:14px}
        .tl-item{display:flex;gap:11px;position:relative}
        .tl-item:not(:last-child){padding-bottom:14px}
        .tl-item:not(:last-child)::after{content:'';position:absolute;left:9px;top:22px;width:1.5px;bottom:0;background:var(--border)}
        .tl-dot{width:20px;height:20px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;background:#fff;z-index:1}
        .tl-dot.done{border-color:var(--green)}.tl-dot.now{border-color:var(--accent);background:var(--accent);animation:pulse 2s ease-in-out infinite}.tl-dot.idle{border-color:var(--border)}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,123,246,.4)}50%{box-shadow:0 0 0 5px rgba(59,123,246,0)}}
        .tl-t{font-size:12.5px;font-weight:600;color:var(--text);padding-top:1px}
        .saldo-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:18px;margin-bottom:14px;box-shadow:var(--sh)}
        .saldo-card h4{font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:14px}
        .saldo-row{padding:10px 0;border-bottom:1px solid var(--border)}
        .saldo-row:last-child{border-bottom:none;padding-bottom:0}
        .saldo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .saldo-lbl{font-size:12.5px;color:var(--text2);font-weight:500}
        .saldo-val{font-family:var(--serif);font-size:16px;color:var(--text)}
        .saldo-sub{font-size:11px;color:var(--text3);margin-top:3px}
        .prog{background:var(--surface2);border-radius:100px;height:5px;overflow:hidden}
        .prog-fill{height:100%;border-radius:100px;background:var(--accent);transition:width .5s ease}
        .prog-fill.warn{background:var(--amber)}
        .prog-fill.full{background:var(--red)}
        .card{background:#fff;border-radius:var(--r);border:1px solid var(--border);box-shadow:var(--sh);overflow:hidden}
        .mt{width:100%;border-collapse:collapse}
        .mt th{padding:9px 16px;font-size:10.5px;font-weight:600;color:var(--text3);text-align:left;text-transform:uppercase;background:var(--surface2);border-bottom:1px solid var(--border)}
        .mt td{padding:11px 16px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
        .mt tr:last-child td{border-bottom:none}
        .bold{font-weight:600;color:var(--text)}
        .pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px}
        .pill::before{content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .pill.ok{background:var(--green-bg);color:var(--green)}.pill.ok::before{background:var(--green)}
        .pill.wait{background:var(--amber-bg);color:var(--amber)}.pill.wait::before{background:var(--amber)}
        .pill.no{background:var(--red-bg);color:var(--red)}.pill.no::before{background:var(--red)}
        .pill.blue{background:var(--blue-bg);color:var(--blue)}.pill.blue::before{background:var(--blue)}
        .perfil-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:24px;box-shadow:var(--sh);margin-bottom:16px}
        .perfil-av{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6AA3FF);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;margin-bottom:14px}
        .perfil-nome{font-size:18px;font-weight:600;color:var(--text);margin-bottom:2px}
        .perfil-cargo{font-size:13px;color:var(--text3);margin-bottom:16px}
        .perfil-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .perfil-field{display:flex;flex-direction:column;gap:3px}
        .perfil-lbl{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
        .perfil-val{font-size:13.5px;color:var(--text);font-weight:500}
        .btn{padding:9px 18px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
        .btn:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
        .btn.navy{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:600}
        .btn.navy:hover:not(:disabled){background:var(--navy-mid)}
        .btn:disabled{opacity:.5;cursor:not-allowed}

        /* Form Solicitar */
        .form-card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:22px;box-shadow:var(--sh)}
        .f-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .f-field{display:flex;flex-direction:column;gap:5px}
        .f-field.full{grid-column:1/-1}
        .f-label{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.1px}
        .f-inp{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);background:var(--surface);font-family:var(--sans);font-size:13.5px;color:var(--text);outline:none;transition:all .2s}
        .f-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,123,246,.11);background:#fff}
        select.f-inp{cursor:pointer}
        textarea.f-inp{resize:vertical;min-height:72px}
        .split-row{display:flex;gap:8px;flex-wrap:wrap}
        .split-opt{padding:8px 14px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .18s}
        .split-opt:hover{border-color:var(--border2)}
        .split-opt.active{background:var(--navy);border-color:var(--navy);color:#fff}
        .f-actions{display:flex;gap:8px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border);margin-top:4px}
        .alert-box{background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--r-sm);padding:10px 14px;font-size:13px;color:var(--red);display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .f-hint{font-size:11.5px;color:var(--text3);margin-top:2px}
        .success-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;padding:64px 32px}
        .success-icon{width:64px;height:64px;background:var(--green-bg);border:2px solid var(--green-border);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .success-icon svg{width:28px;height:28px;stroke:var(--green);fill:none;stroke-width:2.5;stroke-linecap:round}
        
      `}</style>
      <div className="shell">
        <Sidebar variant="servidor" activeItem={tab} onItemClick={(id) => setTab(id as Tab)} />

        <div className="main">
          <div className="topbar">
            <div className="tb-title">
              {tab === 'inicio' && 'Meu painel'}
              {tab === 'historico' && 'Histórico de férias'}
              {tab === 'perfil' && 'Meu perfil'}
              {tab === 'solicitar' && 'Solicitar Férias'}
            </div>
            <div className="tb-sub">
              {tab === 'inicio' && `${perfil.setor} · ${perfil.orgao}`}
              {tab === 'historico' && 'Todas as suas solicitações'}
              {tab === 'perfil' && 'Seus dados funcionais'}
              {tab === 'solicitar' && 'Abra uma nova solicitação de férias'}
            </div>
          </div>

          <div className="content">

            {tab === 'inicio' && (
              <>
                <div className="hero">
                  <div className="hero-greeting">{saudacao},</div>
                  <div className="hero-nome">{perfil.nome.split(' ')[0]} {perfil.nome.split(' ').slice(-1)[0]}</div>
                  <div className="hero-cargo">{perfil.cargo} · {perfil.setor}</div>
                  <div className="hero-stats">
                    <div className="hero-stat"><span className="hero-stat-val">{saldoTotal}d</span><span className="hero-stat-lbl">Saldo férias</span></div>
                    <div className="hero-stat"><span className="hero-stat-val">{anos}a</span><span className="hero-stat-lbl">Anos serviço</span></div>
                    <div className="hero-stat"><span className="hero-stat-val">{pendentes.length}</span><span className="hero-stat-lbl">Em andamento</span></div>
                  </div>
                </div>

                <div className="two-col">
                  <div>
                    {emRisco && (
                      <div className="alert-warn">
                        <Icon t="warn" /><div><strong>Atenção ao saldo acumulado:</strong> você tem {saldoTotal} dias — solicite férias.</div>
                      </div>
                    )}
                    <div className="cta-card" onClick={() => setTab('solicitar')}>
                      <div className="cta-icon"><Icon t="plus" /></div>
                      <div>
                        <div className="cta-title">Solicitar férias</div>
                        <div className="cta-sub">Abrir nova solicitação de férias ou licença</div>
                      </div>
                      <div style={{ marginLeft:'auto', color:'rgba(255,255,255,.4)' }}><Icon t="chevron" /></div>
                    </div>

                    {pendentes.length > 0 && (
                      <>
                        <div className="section-title">Em andamento</div>
                        {pendentes.map(s => (
                          <div className="pendente-card" key={s.id}>
                            <div className="pendente-head" onClick={() => setExpandido(expandido === s.id ? null : s.id)}>
                              <div className="pendente-head-left">
                                <span className={pillStatus(s.status)}>{s.status}</span>
                                <div><div className="pendente-tipo">{s.tipo}</div><div className="pendente-meta">{s.periodo} · {s.dias} dias · {s.exercicio}</div></div>
                              </div>
                              <div style={{ color:'var(--text3)', transform: expandido === s.id ? 'rotate(90deg)' : 'none' }}><Icon t="chevron" /></div>
                            </div>
                            {expandido === s.id && (
                              <div className="pendente-body">
                                <div className="tl">
                                  {timelineStatus(s.status).map((tl, i) => (
                                    <div className="tl-item" key={i}>
                                      <div className={`tl-dot ${tl.estado}`}>
                                        {tl.estado === 'done' && <svg viewBox="0 0 10 10" width={10} height={10} stroke="var(--green)" strokeWidth={2.5} fill="none"><polyline points="2,5 4,8 8,2"/></svg>}
                                      </div>
                                      <div className="tl-t" style={{ color: tl.estado === 'idle' ? 'var(--text3)' : 'var(--text)' }}>{tl.label}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div>
                    <div className="saldo-card">
                      <h4>Meu saldo</h4>
                      {saldos.map(s => (
                        <div className="saldo-row" key={s.exercicio}>
                          <div className="saldo-top">
                            <span className="saldo-lbl">Exercício {s.exercicio}</span>
                            <span className="saldo-val">{s.diasDisponiveis} dias</span>
                          </div>
                          <div className="prog">
                            <div className={`prog-fill ${saldoColor(s.diasDisponiveis, s.diasDireito)}`} style={{ width:`${Math.min((s.diasDisponiveis/s.diasDireito)*100, 100)}%` }} />
                          </div>
                          <div className="saldo-sub">{s.diasUtilizados} usados · {s.diasDisponiveis} disp.{s.vencimento && ` · Vence ${s.vencimento}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'historico' && (
              <div className="card">
                <table className="mt">
                  <thead><tr><th>Tipo</th><th>Período</th><th>Dias</th><th>Exercício</th><th>Solicitado em</th><th>Status</th></tr></thead>
                  <tbody>
                    {solicitacoes.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)' }}>
                          <div style={{ marginBottom:8, fontSize:32, opacity:.4 }}>📋</div>
                          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Nenhuma solicitação encontrada</div>
                          <div style={{ fontSize:12.5 }}>Suas solicitações de férias aparecerão aqui após serem criadas.</div>
                          <button
                            onClick={() => setTab('solicitar')}
                            style={{ marginTop:16, padding:'8px 20px', background:'var(--navy)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--sans)' }}
                          >
                            + Nova Solicitação
                          </button>
                        </td>
                      </tr>
                    ) : solicitacoes.map(s => (
                      <tr key={s.id}>
                        <td className="bold">{s.tipo}</td><td>{s.periodo}</td><td>{s.dias}d</td><td>{s.exercicio}</td><td>{s.criadoEm}</td>
                        <td><span className={pillStatus(s.status)}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'perfil' && (
              <>
                <div className="perfil-card">
                  <div className="perfil-av">{iniciais}</div>
                  <div className="perfil-nome">{perfil.nome}</div>
                  <div className="perfil-cargo">{perfil.cargo}</div>
                  <div className="perfil-grid">
                    {[ ['Matrícula', perfil.matricula], ['Órgão', perfil.orgao], ['Setor', perfil.setor], ['Vínculo', perfil.vinculo], ['Admissão', perfil.admissao], ['E-mail', perfil.email], ['CPF', perfil.cpf] ]
                    .map(([l, v]) => <div className="perfil-field" key={l}><span className="perfil-lbl">{l}</span><span className="perfil-val">{v}</span></div>)}
                  </div>
                </div>
                <button className="btn navy" onClick={() => setTab('solicitar')}><Icon t="cal" />Solicitar férias</button>
              </>
            )}

            {/* TAB SOLICITAÇÃO NATIVA */}
            {tab === 'solicitar' && (
              <div className="layout">
                {enviado ? (
                   <div className="success-wrap">
                     <div className="success-icon"><Icon t="ok" /></div>
                     <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 8 }}>Solicitação enviada com sucesso!</h2>
                     <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20 }}>Suas férias foram encaminhadas para avaliação da gestão.</p>
                     <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn" onClick={resetar}>Nova Solicitação</button>
                        <button className="btn navy" onClick={() => setTab('historico')}>Ver Histórico</button>
                     </div>
                   </div>
                ) : (
                  <>
                  <form onSubmit={handleSolicitar} className="form-card" style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, marginBottom: 20, color: 'var(--text)', fontWeight: 600 }}>Dados do Requerimento</h4>
                    <div className="f-grid">
                      <div className="f-field">
                        <label className="f-label">Tipo de afastamento</label>
                        <select className="f-inp" value={tipo} onChange={e => { setTipo(e.target.value as any); setFracao('INTEGRAL') }}>
                          <option value="FERIAS_INTEGRAL">Férias regulares (30 dias)</option>
                          <option value="FERIAS_FRACIONADA">Férias fracionadas</option>
                          <option value="LICENCA_ESPECIAL">Licença especial (90 dias)</option>
                        </select>
                      </div>
                      <div className="f-field">
                        <label className="f-label">Exercício</label>
                        <select className="f-inp" value={saldoId} onChange={e => setSaldoId(e.target.value)}>
                          {saldos.length === 0 ? <option>Nenhum saldo</option> 
                           : saldos.map(s => <option key={s.exercicio} value={s.exercicio}>{s.exercicio} — {s.diasDisponiveis}d disponíveis</option>)}
                        </select>
                      </div>
                      <div className="f-field">
                        <label className="f-label">Data de início</label>
                        <input className="f-inp" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
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
                              <div key={f.key} className={`split-opt${fracao === f.key ? ' active' : ''}`} onClick={() => setFracao(f.key as any)}>
                                {f.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="f-field full">
                        <label className="f-label">Observações adicionais (opcional)</label>
                        <textarea className="f-inp" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
                      </div>
                    </div>

                    {erro && <div className="alert-box" style={{ marginTop: 14 }}><Icon t="warn" />{erro}</div>}

                    <div className="f-actions" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                      <button type="button" className="btn" onClick={() => setTab('inicio')}>Cancelar</button>
                      <button type="submit" className="btn navy" disabled={saldos.length === 0 || !dataInicio || isPending}>
                        {isPending ? 'Enviando...' : <><Icon t="send" />Enviar Solicitação</>}
                      </button>
                    </div>
                  </form>
                  </>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  )
}