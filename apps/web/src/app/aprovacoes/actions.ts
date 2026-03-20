'use server'

import { revalidatePath } from 'next/cache'
import { apiAprovar, apiNegar } from '@/lib/api-client'

export async function aprovarAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiAprovar(id)
    revalidatePath('/aprovacoes')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Erro ao aprovar' }
  }
}

export async function negarAction(id: string, justificativa?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiNegar(id, justificativa)
    revalidatePath('/aprovacoes')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Erro ao negar' }
  }
}