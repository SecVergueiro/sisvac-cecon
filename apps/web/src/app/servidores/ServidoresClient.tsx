'use client'

import Sidebar from '@/components/Sidebar'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserCard from '@/components/AdminUserCard'
import { signOut } from 'next-auth/react'
import type { ServidorListItem, ServidoresStats } from '@/lib/queries/servidores'

function saldoPill(saldo: number) {
  if (saldo >= 75) return 'pill no'
  if (saldo >= 45) return 'pill wait'
  return 'pill ok'
}

function situacaoPill(s: string) {
  if (s === 'Ativo')       return 'pill ok'
  if (s === 'Em descanso')     return 'pill blue'
  if (s === 'Risco perda') return 'pill wait'
  return 'pill no'
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')
}

function NavIcon({ t }: { t: string }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }
  switch (t) {
    case 'grid':     return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal':return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':      return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':    return <svg {...p} width={16} height={16}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'file':     return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'logout':   return <svg {...p} width={16} height={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'logo':     return <svg {...p} width={14} height={14}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    case 'search':   return <svg {...p} width={15} height={15}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    case 'warn':     return <svg {...p} width={16} height={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'plus':     return <svg {...p} width={14} height={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'x':        return <svg {...p} width={12} height={12}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    case 'filter':   return <svg {...p} width={14} height={14}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>
    default:         return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface Props {
  servidores: ServidorListItem[]
  stats: ServidoresStats
}

export default function ServidoresClient({ servidores, stats }: Props) {
  const router = useRouter()
  const [busca, setBusca]               = useState('')
  const [setor, setSetor]               = useState('Todos')
  const [filtroSituacao, setFiltroSituacao] = useState('Todos')
  const [filtroRisco, setFiltroRisco]   = useState(false)

  const setores = ['Todos', ...Array.from(new Set(servidores.map(s => s.setor))).sort()]

  const filtrados = useMemo(() => {
    return servidores.filter(s => {
      const q = busca.toLowerCase()
      const matchBusca    = !busca || s.nome.toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q) || s.cargo.toLowerCase().includes(q)
      const matchSetor    = setor === 'Todos' || s.setor === setor
      const matchRisco    = !filtroRisco || s.saldo >= 75
      const matchSituacao = filtroSituacao === 'Todos' || s.situacao === filtroSituacao
      return matchBusca && matchSetor && matchRisco && matchSituacao
    })
  }, [servidores, busca, setor, filtroRisco, filtroSituacao])

  const filtrosAtivos = (setor !== 'Todos' ? 1 : 0) + (filtroRisco ? 1 : 0) + (filtroSituacao !== 'Todos' ? 1 : 0)

  function limparFiltros() {
    setSetor('Todos'); setFiltroRisco(false); setFiltroSituacao('Todos'); setBusca('')
  }

  return (
    <>
      

      <div className="shell">
        <Sidebar variant="admin" activeItem="servidores" />

        <div className="main">
          <div className="topbar">
            <div>
              <div className="tb-title">Servidores</div>
              <div className="tb-sub">
                {stats.total} cadastrados · {stats.ativos} ativos · {stats.emRisco} em risco de perda
              </div>
            </div>
            <button className="btn navy" onClick={() => router.push('/servidores/novo')}>
              <NavIcon t="plus" />Novo servidor
            </button>
          </div>

          <div className="content">
            {stats.emRisco > 0 && (
              <div className="alert-risco" onClick={() => setFiltroRisco(true)}>
                <div className="alert-risco-icon"><NavIcon t="warn" /></div>
                <div className="alert-risco-text">
                  <strong>{stats.emRisco} servidores em risco de perda de férias</strong>
                  <p>Saldos ≥ 75 dias com vencimento próximo</p>
                </div>
                <span className="alert-risco-btn">Ver lista →</span>
              </div>
            )}

            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><NavIcon t="search" /></span>
                <input
                  className="search-inp"
                  placeholder="Buscar por nome, matrícula ou cargo…"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
              <select className="f-select" value={setor} onChange={e => setSetor(e.target.value)}>
                {setores.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="f-select" value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)}>
                {['Todos', 'Ativo', 'Em descanso', 'Risco perda', 'Inativo'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className={`btn${filtroRisco ? ' risco-on' : ''}`} onClick={() => setFiltroRisco(v => !v)}>
                <NavIcon t="warn" />{filtroRisco ? 'Somente risco' : 'Filtrar risco'}
              </button>
              {filtrosAtivos > 0 && (
                <div className="chip" onClick={limparFiltros}>
                  <NavIcon t="x" />Limpar {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="card">
              <table className="ft">
                <thead>
                  <tr>
                    <th>Nome</th><th>Matrícula</th><th>Setor</th>
                    <th>Cargo</th><th>Saldo férias</th><th>Situação</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty">Nenhum servidor encontrado com os filtros aplicados.</div></td></tr>
                  ) : filtrados.map(s => (
                    <tr
                      key={s.id}
                      className={s.saldo >= 75 ? 'risco-row' : ''}
                      onClick={() => router.push(`/servidores/${s.id}`)}
                    >
                      <td>
                        <div className="td-nome">
                          <div className="td-avatar">{iniciais(s.nome)}</div>
                          <span className="td-bold">{s.nome}</span>
                        </div>
                      </td>
                      <td><span className="td-mono">{s.matricula}</span></td>
                      <td>{s.setor}</td>
                      <td>{s.cargo}</td>
                      <td><span className={saldoPill(s.saldo)}>{s.saldo}d{s.saldo >= 75 ? ' !' : ''}</span></td>
                      <td><span className={situacaoPill(s.situacao)}>{s.situacao}</span></td>
                      <td>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 11.5 }}
                          onClick={e => { e.stopPropagation(); router.push(`/servidores/${s.id}`) }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <span className="tf-count">
                  {filtrados.length} de {stats.total} servidor{stats.total !== 1 ? 'es' : ''}
                  {filtrosAtivos > 0 ? ` (${filtrosAtivos} filtro${filtrosAtivos > 1 ? 's' : ''} ativo${filtrosAtivos > 1 ? 's' : ''})` : ''}
                </span>
                <span className="tf-count">
                  {filtrados.filter(s => s.saldo >= 75).length} em risco nesta visualização
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}