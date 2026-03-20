import { getServidores, getServidoresStats } from '@/lib/queries/servidores'
import ServidoresClient from './ServidoresClient'

// Server Component — busca dados no servidor antes de renderizar
export default async function ServidoresPage() {
  const [servidores, stats] = await Promise.all([
    getServidores(),
    getServidoresStats(),
  ])

  return <ServidoresClient servidores={servidores} stats={stats} />
}