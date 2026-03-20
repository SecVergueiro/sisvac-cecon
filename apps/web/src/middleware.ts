import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@sisvac/types'

// Rotas públicas — não exigem autenticação
const PUBLIC_ROUTES = ['/auth/login', '/api/auth']

// Rotas exclusivas do RH/ADMIN
const RH_ONLY_ROUTES = [
  '/dashboard',
  '/aprovacoes',
  '/servidores',
  '/relatorios',
  '/ferias',
]

// Rotas exclusivas do servidor
const SERVIDOR_ONLY_ROUTES = ['/meu-painel']

export default auth((req: any) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // 1. Não autenticado → login
  if (!req.auth && !isPublic) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!req.auth) return NextResponse.next()

  const role = req.auth.user?.role as UserRole | undefined

  // 2. Raiz "/" → redireciona conforme role
  if (pathname === '/') {
    if (role === UserRole.SERVIDOR) {
      return NextResponse.redirect(new URL('/meu-painel', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 3. SERVIDOR tentando acessar área do RH → meu-painel
  if (role === UserRole.SERVIDOR) {
    const isRhRoute = RH_ONLY_ROUTES.some(r => pathname.startsWith(r))
    if (isRhRoute) {
      return NextResponse.redirect(new URL('/meu-painel', req.url))
    }
  }

  // 4. RH/ADMIN tentando acessar área do servidor → dashboard
  if (role === UserRole.RH || role === UserRole.ADMIN) {
    const isServidorRoute = SERVIDOR_ONLY_ROUTES.some(r => pathname.startsWith(r))
    if (isServidorRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}