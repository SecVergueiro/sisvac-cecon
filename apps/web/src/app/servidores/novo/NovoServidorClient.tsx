'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import { cadastrarServidorAction, type TipoVinculo } from './actions'

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
    case 'ok':        return <svg {...p} width={14} height={14}><polyline points="20,6 9,17 4,12"/></svg>
    case 'warn':      return <svg {...p} width={14} height={14}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'save':      return <svg {...p} width={14} height={14}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
    case 'user-plus': return <svg {...p} width={14} height={14}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
    default:          return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

// ── Formatação de CPF ──────────────────────────────────────────
function formatCPF(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)
}

// ── Validação básica de CPF ────────────────────────────────────
function cpfValido(cpf: string) {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(nums[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(nums[10])
}

interface Props {
  cargos:  { id: number; nome: string }[]
  setores: { id: number; nome: string }[]
}

export default function NovoServidorClient({ cargos, setores }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [nome,         setNome]         = useState('')
  const [cpf,          setCpf]          = useState('')
  const [matricula,    setMatricula]    = useState('')
  const [idCargo,      setIdCargo]      = useState<number>(cargos[0]?.id ?? 0)
  const [idSetor,      setIdSetor]      = useState<number>(setores[0]?.id ?? 0)
  const [tipoVinculo,  setTipoVinculo]  = useState<TipoVinculo>('ESTATUTARIO')
  const [dataAdmissao, setDataAdmissao] = useState('')
  const [erro,         setErro]         = useState('')
  const [enviado,      setEnviado]      = useState(false)
  const [novoId,       setNovoId]       = useState<string | null>(null)

  const cpfOk = cpf.length === 14 && cpfValido(cpf)
  const formOk = nome.trim().length >= 3 && cpfOk && matricula.trim().length >= 5 && idCargo && idSetor && dataAdmissao

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formOk) return
    setErro('')

    startTransition(async () => {
      const result = await cadastrarServidorAction({
        nome:         nome.trim(),
        cpf,
        matricula:    matricula.trim().toUpperCase(),
        idCargo,
        idSetor,
        tipoVinculo,
        dataAdmissao,
      })

      if (result.ok) {
        setNovoId(result.id ?? null)
        setEnviado(true)
      } else {
        setErro(result.error ?? 'Erro desconhecido')
      }
    })
  }

  return (
    <>
      

      <div className="shell">
        <Sidebar variant="admin" activeItem="servidores" />

        <div className="main">
          <div className="topbar">
            <div className="tb-back" onClick={() => router.push('/servidores')}><Icon t="back" /></div>
            <div>
              <div className="tb-title">Cadastrar servidor</div>
              <div className="tb-sub">Adicionar novo servidor ao sistema</div>
            </div>
          </div>

          <div className="content">
            {enviado ? (
              <div className="success-wrap">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
                </div>
                <h2>Servidor cadastrado!</h2>
                <p>O servidor foi adicionado ao sistema com sucesso. O saldo de férias será gerado automaticamente no próximo exercício.</p>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn" onClick={() => { setEnviado(false); setNome(''); setCpf(''); setMatricula(''); setDataAdmissao('') }}>
                    Cadastrar outro
                  </button>
                  {novoId && (
                    <button className="btn" onClick={() => router.push(`/servidores/${novoId}`)}>
                      Ver servidor
                    </button>
                  )}
                  <button className="btn navy" onClick={() => router.push('/servidores')}>
                    Voltar à lista
                  </button>
                </div>
              </div>
            ) : (
              <form className="form-wrap" onSubmit={handleSubmit}>
                {/* DADOS PESSOAIS */}
                <div className="form-card">
                  <h4><span className="badge">1</span>Dados pessoais</h4>
                  <div className="f-grid">
                    <div className="f-field full">
                      <label className="f-label">Nome completo</label>
                      <input
                        className="f-inp"
                        placeholder="Ex: João da Silva Pereira"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        required
                      />
                      {nome.length > 0 && nome.trim().length < 3 && (
                        <span className="f-hint err">Nome deve ter pelo menos 3 caracteres</span>
                      )}
                    </div>
                    <div className="f-field">
                      <label className="f-label">CPF</label>
                      <input
                        className={`f-inp${cpf.length === 14 ? (cpfOk ? ' ok' : ' err') : ''}`}
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={e => setCpf(formatCPF(e.target.value))}
                        maxLength={14}
                        required
                      />
                      {cpf.length === 14 && (
                        <span className={`f-hint ${cpfOk ? 'ok' : 'err'}`}>
                          {cpfOk ? '✓ CPF válido' : '✗ CPF inválido'}
                        </span>
                      )}
                    </div>
                    <div className="f-field">
                      <label className="f-label">Data de admissão</label>
                      <input
                        className="f-inp"
                        type="date"
                        value={dataAdmissao}
                        onChange={e => setDataAdmissao(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* DADOS FUNCIONAIS */}
                <div className="form-card">
                  <h4><span className="badge">2</span>Dados funcionais</h4>
                  <div className="f-grid">
                    <div className="f-field">
                      <label className="f-label">Matrícula</label>
                      <input
                        className="f-inp"
                        placeholder="Ex: 1032755A"
                        value={matricula}
                        onChange={e => setMatricula(e.target.value.toUpperCase())}
                        required
                      />
                      <span className="f-hint">Identificador único do servidor</span>
                    </div>
                    <div className="f-field">
                      <label className="f-label">Tipo de vínculo</label>
                      <select className="f-inp" value={tipoVinculo} onChange={e => setTipoVinculo(e.target.value as TipoVinculo)}>
                        <option value="ESTATUTARIO">Estatutário</option>
                        <option value="COMISSIONADO">Comissionado</option>
                        <option value="ESTATUTARIO_COMISSIONADO">Estatutário + Comissionado</option>
                      </select>
                    </div>
                    <div className="f-field">
                      <label className="f-label">Cargo</label>
                      <select className="f-inp" value={idCargo} onChange={e => setIdCargo(Number(e.target.value))} required>
                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="f-field">
                      <label className="f-label">Setor</label>
                      <select className="f-inp" value={idSetor} onChange={e => setIdSetor(Number(e.target.value))} required>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {erro && (
                  <div className="alert-err">
                    <Icon t="warn" />{erro}
                  </div>
                )}

                <div className="form-card" style={{ background:'var(--surface)', border:'1px dashed var(--border2)' }}>
                  <div style={{ fontSize:12.5, color:'var(--text3)', lineHeight:1.6 }}>
                    <strong style={{ color:'var(--text2)', display:'block', marginBottom:4 }}>O que acontece ao cadastrar:</strong>
                    O sistema cria o funcionário e a matrícula via <code style={{ background:'var(--surface2)', padding:'1px 5px', borderRadius:4, fontSize:11.5 }}>fn_cadastrar_servidor</code>.
                    O saldo de férias é gerado automaticamente pelo trigger quando o exercício for criado.
                    Para que o servidor acesse o sistema, crie o usuário no Supabase Auth com o mesmo CPF.
                  </div>
                </div>

                <div className="f-actions">
                  <button type="button" className="btn" onClick={() => router.push('/servidores')}>Cancelar</button>
                  <button type="submit" className="btn navy" disabled={!formOk || isPending}>
                    {isPending
                      ? <><span className="spinner"/>Cadastrando…</>
                      : <><Icon t="save"/>Cadastrar servidor</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}