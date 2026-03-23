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