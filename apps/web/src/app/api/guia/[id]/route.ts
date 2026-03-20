import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const token = (session as any)?.accessToken

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
  
  // Faz um fetch pro NestJS repassando o contexto do JWT logado
  const res = await fetch(`${API_URL}/api/v1/ferias/${id}/guia`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    return new NextResponse('Erro ao buscar guia. A solicitação pode não existir.', { status: res.status })
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/pdf')
  headers.set('Content-Disposition', `inline; filename="guia-${id}.pdf"`)

  return new NextResponse(res.body, { status: 200, headers })
}
