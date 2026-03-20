import { getCargosESetores } from './actions'
import NovoServidorClient from './NovoServidorClient'

export default async function NovoServidorPage() {
  const { cargos, setores } = await getCargosESetores()
  return <NovoServidorClient cargos={cargos} setores={setores} />
}