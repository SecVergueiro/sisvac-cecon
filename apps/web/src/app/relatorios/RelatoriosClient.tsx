'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ServidorListItem } from '@/lib/queries/servidores'

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

const HISTORICO: RelatorioGerado[] = []

const TIPOS = [
  { value: 'ferias-setor', label: 'Férias por setor'      },
  { value: 'risco',        label: 'Servidores em risco'   },
  { value: 'licencas',     label: 'Licenças especiais'    },
  { value: 'geral',        label: 'Relatório geral'       },
]

const SETORES   = ['Todos', 'Imagenologia', 'Diretoria Técnica', 'Divisão ADM', 'Setor FARP', 'Setor NUTI', 'Tecnologia da Informação', 'Recursos Humanos']
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
function PreviewPDF({ tipo, setor, periodo, servidores }: { tipo: TipoRelatorio; setor: string; periodo: string; servidores: ServidorListItem[] }) {
  const titulo = TIPOS.find(t => t.value === tipo)?.label ?? 'Relatório'
  const isRisco = tipo === 'risco'

  // Filtrar servidores
  let lista = setor === 'Todos' ? servidores : servidores.filter(s => s.setor === setor)
  if (isRisco) {
    lista = lista.filter(s => s.situacao === 'Risco perda')
  } else if (tipo === 'licencas') {
    // Apenas simulação de quem tem saldo de licença
    lista = lista.filter(s => s.saldoLicenca > 0)
  }

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
        
        {/* linhas (com slice para não estourar a visualização local) */}
        {lista.length === 0 ? (
          <div style={{ padding: '15px', textAlign: 'center', fontSize: 11, color: '#9aa5b4' }}>
            Nenhum servidor encontrado para estes filtros.
          </div>
        ) : (
          lista.slice(0, 5).map((s, i) => {
            const warningCode = s.situacao === 'Risco perda';
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, padding: '5px 10px', borderTop: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f7f8fc' }}>
                <div style={{ fontSize: 10, color: '#4a5568', fontWeight: 600 }}>{s.nome}</div>
                <div style={{ fontSize: 10, color: '#4a5568' }}>{s.matricula}</div>
                <div style={{ fontSize: 10, color: '#4a5568' }}>{s.saldo}d</div>
                <div style={{ fontSize: 10, color: warningCode ? '#d97706' : '#4a5568' }}>
                  {warningCode ? '⚠ Risco' : s.situacao}
                </div>
              </div>
            )
          })
        )}
        
        {lista.length > 5 && (
          <div style={{ padding: '5px 10px', borderTop: '1px solid #e2e8f0', background: '#f7f8fc', fontSize: 9, color: '#9aa5b4', fontStyle: 'italic' }}>
            + {lista.length - 5} registros adicionais contidos no documento…
          </div>
        )}
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
export default function RelatoriosClient({ servidores }: { servidores: ServidorListItem[] }) {
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
                <PreviewPDF tipo={tipo} setor={setor} periodo={periodo} servidores={servidores} />
              </div>
            </div>

            {/* histórico */}
            <div className="section-title">Gerados nesta sessão (Local)</div>
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
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#9aa5b4' }}>
                        Nenhum relatório gerado ainda. Tente gerar um acima.
                      </td>
                    </tr>
                  )}
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
