'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aprovarAction, negarAction } from './actions'
import type { SolicitacaoPendente, SolicitacaoHistorico } from '@/lib/queries/aprovacoes'

function pillClass(s: string) {
  if (s === 'Aprovado') return 'pill ok'
  if (s === 'Pendente') return 'pill wait'
  if (s === 'Em descanso') return 'pill blue'
  if (s === 'Reprovado') return 'pill no'
  return 'pill'
}

function NavIcon({ t }: { t: string }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
  switch (t) {
    case 'grid': return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'check-cal': return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case 'cal': return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case 'users': return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" /></svg>
    case 'file': return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
    case 'logout': return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    case 'logo': return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    case 'ok': return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12" /></svg>
    case 'x': return <svg {...p} width={14} height={14}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    default: return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10" /></svg>
  }
}

interface Props {
  pendentes: SolicitacaoPendente[]
  historico: SolicitacaoHistorico[]
}

export default function AprovacoesClient({ pendentes: initialPendentes, historico: initialHistorico }: Props) {
  const router = useRouter()
  const [pendentes, setPendentes] = useState(initialPendentes)
  const [historico, setHistorico] = useState(initialHistorico)
  const [saindo, setSaindo] = useState<string | null>(null)

  // Modais
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aprovar' | 'negar' } | null>(null)
  const [detalhesItem, setDetalhesItem] = useState<SolicitacaoPendente | null>(null)
  const [detalhesHistorico, setDetalhesHistorico] = useState<SolicitacaoHistorico | null>(null)

  const [justificativa, setJustificativa] = useState('')
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'no' } | null>(null)
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
      // Otimistic UI — remove imediatamente da fila de pendentes
      setSaindo(id)
      await new Promise(r => setTimeout(r, 350))
      setPendentes(prev => prev.filter(p => p.id !== id))
      setSaindo(null)

      // Chama a Server Action
      const result = acao === 'aprovar'
        ? await aprovarAction(id)
        : await negarAction(id, justificativa || undefined)

      if (result.ok) {
        // Adiciona ao histórico local na hora (com todos os detalhes para o modal funcionar!)
        setHistorico(prev => [{
          id,
          nome: item.nome,
          matricula: item.matricula,
          periodo: item.periodo,
          dias: item.dias,
          status: acao === 'aprovar' ? 'Aprovado' : 'Reprovado',
          aprovadoPor: acao === 'aprovar' ? 'Gestor RH' : null,
          negadoPor: acao === 'negar' ? 'Gestor RH' : null,
          data: new Date().toLocaleDateString('pt-BR'),
          setor: item.setor,
          tipo: item.tipo,
          fracionamento: item.fracionamento,
          observacoes: item.observacoes
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
                    <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" /></svg>
                  </div>
                  <h3>Tudo em dia!</h3>
                  <p>Nenhuma solicitação aguardando aprovação.</p>
                </div>
              ) : (
                <div className="aprov-list">
                  {pendentes.map(item => (
                    <div
                      key={item.id}
                      className={`aprov-item${saindo === item.id ? ' saindo' : ''}`}
                      onClick={() => setDetalhesItem(item)}
                      style={{ cursor: 'pointer' }}
                      title="Clique para ver detalhes do requerimento"
                    >
                      <div className="aprov-avatar">
                        {item.nome.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0]).join('')}
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
                <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                  Nenhum histórico ainda.
                </div>
              ) : (
                <table className="mt">
                  <thead>
                    <tr><th>Servidor</th><th>Matrícula</th><th>Período</th><th>Dias</th><th>Status</th><th>Data</th></tr>
                  </thead>
                  <tbody>
                    {historico.map(h => (
                      <tr
                        key={h.id}
                        onClick={() => setDetalhesHistorico(h)}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ver o histórico desta solicitação"
                      >
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

      {/* MODAL DE DETALHES - PENDENTES */}
      {detalhesItem && (
        <div className="modal-overlay" onClick={() => setDetalhesItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text1)' }}>Detalhes do Pedido</h3>
              <button className="btn" style={{ padding: '6px 10px' }} onClick={() => setDetalhesItem(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: 14, color: 'var(--text2)' }}>
              <div><strong style={{ color: 'var(--text1)' }}>Servidor:</strong> {detalhesItem.nome} ({detalhesItem.matricula})</div>
              <div><strong style={{ color: 'var(--text1)' }}>Setor:</strong> {detalhesItem.setor}</div>
              <div><strong style={{ color: 'var(--text1)' }}>Tipo de Afastamento:</strong> {detalhesItem.tipo} {detalhesItem.fracionamento !== 'Integral' ? `— Fracionamento: ${detalhesItem.fracionamento}` : ''}</div>
              <div><strong style={{ color: 'var(--text1)' }}>Período Solicitado:</strong> {detalhesItem.periodo} ({detalhesItem.dias} dias)</div>
              <div><strong style={{ color: 'var(--text1)' }}>Solicitado em:</strong> {detalhesItem.criadoEm}</div>

              <div style={{ marginTop: 10, padding: 12, background: 'var(--surface2)', borderRadius: 6 }}>
                <strong style={{ color: 'var(--text1)', display: 'block', marginBottom: 4 }}>Observações do Servidor:</strong>
                <span style={{ whiteSpace: 'pre-wrap' }}>{detalhesItem.observacoes || 'Nenhuma observação informada.'}</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button
                className="btn danger"
                onClick={() => { setDetalhesItem(null); setConfirmando({ id: detalhesItem.id, acao: 'negar' }) }}
              >
                <NavIcon t="x" /> Negar
              </button>
              <button
                className="btn success"
                onClick={() => { setDetalhesItem(null); setConfirmando({ id: detalhesItem.id, acao: 'aprovar' }) }}
              >
                <NavIcon t="ok" /> Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES - HISTÓRICO (Novo!) */}
      {detalhesHistorico && (
        <div className="modal-overlay" onClick={() => setDetalhesHistorico(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text1)' }}>Detalhes do Histórico</h3>
              <button className="btn" style={{ padding: '6px 10px' }} onClick={() => setDetalhesHistorico(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: 14, color: 'var(--text2)' }}>
              <div><strong style={{ color: 'var(--text1)' }}>Servidor:</strong> {detalhesHistorico.nome} ({detalhesHistorico.matricula})</div>

              {detalhesHistorico.setor && (
                <div><strong style={{ color: 'var(--text1)' }}>Setor:</strong> {detalhesHistorico.setor}</div>
              )}

              {detalhesHistorico.tipo && (
                <div><strong style={{ color: 'var(--text1)' }}>Tipo de Afastamento:</strong> {detalhesHistorico.tipo} {detalhesHistorico.fracionamento && detalhesHistorico.fracionamento !== 'Integral' ? `— Fracionamento: ${detalhesHistorico.fracionamento}` : ''}</div>
              )}

              <div><strong style={{ color: 'var(--text1)' }}>Período Solicitado:</strong> {detalhesHistorico.periodo} ({detalhesHistorico.dias} dias)</div>

              <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <strong style={{ color: 'var(--text1)', display: 'block', marginBottom: 2 }}>Status: <span className={pillClass(detalhesHistorico.status)}>{detalhesHistorico.status}</span></strong>
                  {(detalhesHistorico.aprovadoPor || detalhesHistorico.negadoPor) && (
                    <span style={{ fontSize: 13 }}>
                      {detalhesHistorico.status === 'Reprovado' ? 'Negado por' : 'Aprovado por'} <strong>{detalhesHistorico.aprovadoPor || detalhesHistorico.negadoPor}</strong> em {detalhesHistorico.data}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 10, padding: 12, border: '1px dashed var(--border)', borderRadius: 6 }}>
                <strong style={{ color: 'var(--text1)', display: 'block', marginBottom: 4 }}>Observações do Servidor:</strong>
                <span style={{ whiteSpace: 'pre-wrap' }}>{detalhesHistorico.observacoes || 'Nenhuma observação informada.'}</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="btn navy" onClick={() => setDetalhesHistorico(null)}>
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO (Aprovar/Negar) */}
      {confirmando && item && (
        <div className="modal-overlay" onClick={() => setConfirmando(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${isAprovar ? 'ok' : 'no'}`}>
              <svg viewBox="0 0 24 24">
                {isAprovar
                  ? <polyline points="20,6 9,17 4,12" />
                  : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
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
              ? <polyline points="20,6 9,17 4,12" />
              : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            }
          </svg>
          {toast.msg}
        </div>
      )}
    </>
  )
}