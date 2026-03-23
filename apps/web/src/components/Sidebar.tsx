'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminUserCard from './AdminUserCard'

export function SidebarIcon({ t }: { t: string }) {
  const p = { stroke:'currentColor', fill:'none', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' }
  switch(t) {
    case 'grid':     return <svg {...p} width={16} height={16}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'check-cal':return <svg {...p} width={16} height={16}><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'cal':      return <svg {...p} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'users':    return <svg {...p} width={16} height={16}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'file':     return <svg {...p} width={16} height={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
    case 'settings': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    case 'home':    return <svg {...p} width={16} height={16}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
    case 'history': return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
    case 'user':    return <svg {...p} width={16} height={16}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    case 'plus':    return <svg {...p} width={14} height={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    default:         return <svg {...p} width={16} height={16}><circle cx="12" cy="12" r="10"/></svg>
  }
}

interface SidebarProps {
  variant: 'admin' | 'servidor';
  activeItem?: string;
  onItemClick?: (id: string, route: string) => void;
  pendentesCount?: number;
}

export default function Sidebar({ variant, activeItem, onItemClick, pendentesCount = 0 }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  type MenuItem = { id: string; route: string; icon: string; label: string; badge?: number };

  const adminMenu: MenuItem[] = [
    { id: 'inicio', route: '/dashboard', icon: 'grid', label: 'Início' },
    { id: 'aprovacoes', route: '/aprovacoes', icon: 'check-cal', label: 'Aprovações', badge: pendentesCount },
    { id: 'ferias', route: '/ferias', icon: 'cal', label: 'Nova solicitação' },
    { id: 'servidores', route: '/servidores', icon: 'users', label: 'Servidores' },
    { id: 'relatorios', route: '/relatorios', icon: 'file', label: 'Relatórios' },
  ]

  const servidorMenu: MenuItem[] = [
    { id: 'inicio', route: '/meu-painel#inicio', icon: 'home', label: 'Início' },
    { id: 'historico', route: '/meu-painel#historico', icon: 'history', label: 'Histórico' },
    { id: 'perfil', route: '/meu-painel#perfil', icon: 'user', label: 'Meu perfil' },
    { id: 'solicitar', route: '/meu-painel#solicitar', icon: 'plus', label: 'Nova Solicitação' },
  ]

  const menu = variant === 'admin' ? adminMenu : servidorMenu;

  const handleClick = (m: any) => {
    setIsOpen(false)
    if (onItemClick) {
      onItemClick(m.id, m.route);
    } else {
      router.push(m.route);
    }
  }

  // Inferência automática se a prop activeItem não for passada:
  // Para páginas puras, olhamos o pathname. Se o pathname acabar com o route, tá ativo.
  let current = activeItem;
  if (!current) {
     const match = menu.find(m => pathname.startsWith(m.route.split('#')[0]));
     current = match ? match.id : '';
  }

  return (
    <>
      <button 
        type="button" 
        className="mobile-menu-btn fixed-hamburger" 
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
      </button>

      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sb-logo" style={{ display: 'flex', justifyContent: 'center', padding: '24px 18px 10px' }}>
          <img src="/logomore.png" alt="Logo SISVAC" style={{ maxHeight: '42px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      
      <div className="sb-section" style={{ marginTop: 12 }}>Menu</div>
      <div className="sb-nav" style={{ flex: 1, paddingBottom: 6 }}>
        {menu.map(m => (
          <div key={m.id} className={`nav-item ${current === m.id ? 'active' : ''}`} onClick={() => handleClick(m)}>
            <SidebarIcon t={m.icon} />{m.label}
            {!!m.badge && m.badge > 0 && <span className="nb">{m.badge}</span>}
          </div>
        ))}
      </div>
      
      {/* O UserCard vai fixo embaixo (por causa das classes do layout pai que forçam ele pro bottom) */}
      <div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>
        <AdminUserCard />
      </div>
      <div style={{ padding: '0 14px 10px', textAlign: 'center' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.3)', letterSpacing: '.2px' }}>© {new Date().getFullYear()} Isaque Vergueiro</span>
      </div>
    </aside>
  </>
  )
}
