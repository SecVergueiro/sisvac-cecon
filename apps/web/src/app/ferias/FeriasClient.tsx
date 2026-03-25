'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import { criarSolicitacaoAction, getSaldosAction } from './actions'
import type { ServidorParaFerias } from '@/lib/queries/ferias'

type TipoAfastamento = 'FERIAS_INTEGRAL' | 'FERIAS_FRACIONADA' | 'LICENCA_ESPECIAL'
type TipoFracionamento = 'INTEGRAL' | 'QUINZE_QUINZE' | 'DEZ_VINTE' | 'DEZ_DEZ_DEZ'

interface SaldoItem {
  idSaldo: string
  idExercicio: number
  exercicio: string
  diasDisponiveis: number
  emRisco: boolean
}

const FRACOS: { key: TipoFracionamento; label: string; dias: number }[] = [
  { key: 'INTEGRAL', label: 'Integral (30d)', dias: 30 },
  { key: 'QUINZE_QUINZE', label: '15 + 15', dias: 15 },
  { key: 'DEZ_VINTE', label: '10 + 20', dias: 10 },
  { key: 'DEZ_DEZ_DEZ', label: '10 + 10 + 10', dias: 10 },
]

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
    case 'search': return <svg {...p} width={15} height={15}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
    case 'send': return <svg {...p} width={15} height={15}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" /></svg>
    case 'ok': return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12" /></svg>
    case 'warn': return <svg {...p} width={14} height={14}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    default: return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10" /></svg>
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
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState<ServidorParaFerias[]>([])
  const [servidor, setServidor] = useState<ServidorParaFerias | null>(null)
  const [saldos, setSaldos] = useState<SaldoItem[]>([])
  const [saldoSelecionado, setSaldoSelecionado] = useState<SaldoItem | null>(null)
  const [tipo, setTipo] = useState<TipoAfastamento>('FERIAS_INTEGRAL')
  const [fracao, setFracao] = useState<TipoFracionamento>('INTEGRAL')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [obs, setObs] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
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
        idMatricula: servidor.idMatricula,
        idExercicio: saldoSelecionado.idExercicio,
        idSaldoFerias: saldoSelecionado.idSaldo,
        tipoAfastamento: tipo,
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

  const iniciais = servidor?.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('') ?? '?'

  return (
    <>


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
                  <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" /></svg>
                </div>
                <h2>Solicitação registrada!</h2>
                <p>
                  A solicitação de férias de <strong>{servidor?.nome}</strong> foi salva com sucesso e já aparece na fila de aprovações.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
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
                                  <div className="ac-av">{s.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}</div>
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
                          <input className="f-inp" type="date" value={dataFim} readOnly style={{ background: 'var(--surface2)', color: 'var(--text2)' }} />
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

                      {/* AVISO DE SALDO NEGATIVO (Novo!) */}
                      {saldoSelecionado && (saldoSelecionado.diasDisponiveis - diasSolicitados < 0) && (
                        <div className="alert-box" style={{ color: 'var(--red)', marginTop: 15, background: '#fee2e2', border: '1px solid #fca5a5' }}>
                          <NavIcon t="warn" /> Atenção: O servidor não possui saldo suficiente para esta solicitação.
                        </div>
                      )}

                      {erro && <div className="alert-box" style={{ color: 'var(--red)', marginTop: 15 }}>{erro}</div>}

                      <div className="f-actions" style={{ marginTop: 30 }}>
                        <button type="button" className="btn" onClick={() => router.push('/dashboard')}>Cancelar</button>
                        <button
                          type="submit"
                          className="btn navy"
                          disabled={
                            isPending ||
                            !servidor ||
                            !saldoSelecionado ||
                            !dataInicio ||
                            (saldoSelecionado.diasDisponiveis - diasSolicitados < 0) // <-- A TRAVA AQUI!
                          }
                        >
                          {isPending ? 'Enviando...' : 'Enviar Solicitação'}
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
                        <div className="saldo-skeleton" style={{ marginBottom: 12 }} />
                        <div className="saldo-skeleton" style={{ width: '60%' }} />
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
                              style={{ width: `${Math.min((saldoSelecionado.diasDisponiveis / 30) * 100, 100)}%` }}
                            />
                          </div>
                          {saldoSelecionado.emRisco && (
                            <div style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
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
                      <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
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