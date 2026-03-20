'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminUserCard() {
  const [nome, setNome] = useState('Carregando...')
  const [role, setRole] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session').then(r=>r.json()).then(s => {
      if(s?.user?.name) { setNome(s.user.name); setRole(s.user.role || '') }
      else { setNome('Minha Conta'); setRole('Configurações') }
    }).catch(()=>{ setNome('Minha Conta'); setRole('Configurações') })
  }, [])

  const iniciais = (nome && nome !== 'Carregando...') ? nome.substring(0, 2).toUpperCase() : '...'

  return (
    <div
      onClick={() => router.push('/configuracoes')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.1)',
        cursor: 'pointer',
        transition: 'background .18s',
        marginBottom: 4,
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)' }}
    >
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3B7BF6, #6AA3FF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}>
        {iniciais}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.3px' }}>{role}</div>
      </div>
    </div>
  )
}
