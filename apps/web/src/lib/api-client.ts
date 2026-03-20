import { auth } from '@/auth'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001'

// ── Cliente autenticado — pega o token JWT da sessão ──────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await auth()
  const token   = (session as any)?.accessToken

  const tStr = typeof token === 'string' ? token.substring(0, 15) : String(token)
  console.log(`[apiFetch Debug] Path: ${path} | HasToken: ${!!token} | Preview: ${tStr}...`)

  const method = options.method || 'GET'
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let body: any = {}
    try { body = await res.json() } catch {}
    console.error(`[API Fetch Error] ${method} ${path} -> ${res.status}`, body)
    
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message
    throw new Error(msg || body.error || `Erro HTTP ${res.status}`)
  }

  return res.json()
}

// ── Aprovações ────────────────────────────────────────────────
export async function apiAprovar(id: string, observacoes?: string) {
  return apiFetch(`/aprovacoes/${id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({ observacoes }),
  })
}

export async function apiNegar(id: string, justificativa?: string) {
  return apiFetch(`/aprovacoes/${id}/negar`, {
    method: 'PATCH',
    body: JSON.stringify({ justificativa }),
  })
}

export async function apiIniciarDescanso(id: string) {
  return apiFetch(`/aprovacoes/${id}/iniciar-descanso`, { method: 'PATCH' })
}

// ── Férias ────────────────────────────────────────────────────
export async function apiCriarSolicitacao(body: {
  idMatricula:      string
  idExercicio:      number
  idSaldoFerias:    string
  tipoAfastamento:  string
  tipoFracionamento: string
  dataInicio:       string
  dataFim:          string
  diasSolicitados:  number
  observacoes?:     string
}) {
  return apiFetch('/ferias', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function apiCancelarSolicitacao(id: string) {
  return apiFetch(`/ferias/${id}/cancelar`, { method: 'PATCH' })
}