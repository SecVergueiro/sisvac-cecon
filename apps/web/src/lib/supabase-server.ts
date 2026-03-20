import { createClient } from '@supabase/supabase-js'

// Cliente com service role — apenas no servidor (Server Components, Route Handlers)
// NUNCA importe este arquivo em Client Components ('use client')
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}