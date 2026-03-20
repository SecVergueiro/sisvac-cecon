// ── Roles ─────────────────────────────────────────────────────
export enum UserRole {
  ADMIN    = 'ADMIN',
  RH       = 'RH',
  SERVIDOR = 'SERVIDOR',
}

// ── Tipos de vínculo ──────────────────────────────────────────
export enum TipoVinculo {
  ESTATUTARIO  = 'ESTATUTARIO',
  CONTRATADO   = 'CONTRATADO',
  COMISSIONADO = 'COMISSIONADO',
}

// ── Tipos de Férias/Afastamento ───────────────────────────────
export enum TipoAfastamento {
  FERIAS_INTEGRAL   = 'FERIAS_INTEGRAL',
  FERIAS_FRACIONADA = 'FERIAS_FRACIONADA',
  LICENCA_ESPECIAL  = 'LICENCA_ESPECIAL',
}

export enum TipoFracionamento {
  INTEGRAL      = 'INTEGRAL',
  QUINZE_QUINZE = 'QUINZE_QUINZE',
  DEZ_VINTE     = 'DEZ_VINTE',
  DEZ_DEZ_DEZ   = 'DEZ_DEZ_DEZ',
}

// ── Status de solicitação ─────────────────────────────────────
export enum StatusSolicitacao {
  PENDENTE  = 'PENDENTE',
  APROVADO  = 'APROVADO',
  REPROVADO = 'REPROVADO',
  CANCELADO = 'CANCELADO',
}

// ── Interfaces base ───────────────────────────────────────────
export interface Servidor {
  id: string
  nome: string
  cpf: string
  matricula: string
  cargo: string
  setor: string
  tipoVinculo: TipoVinculo
  dataAdmissao: string
  ativo: boolean
}

export interface SaldoFerias {
  id: string
  idMatricula: string
  idExercicio: number
  diasDevidos: number
  diasGozados: number
  diasSaldo: number
}

export interface SolicitacaoFerias {
  id: string
  idMatricula: string
  idExercicio: number
  idSaldoFerias?: string
  idSaldoLicenca?: string
  solicitadoPor: string
  tipoAfastamento: TipoAfastamento
  tipoFracionamento: TipoFracionamento
  dataInicio: string
  dataFim: string
  diasSolicitados: number
  status: StatusSolicitacao
  aprovadoRhPor?: string
  aprovadoRhEm?: string
  aprovadoChefiaPor?: string
  aprovadoChefiaEm?: string
  negadoPor?: string
  negadoEm?: string
  justificativaNegacao?: string
  observacoes?: string
  createdAt: string
  updatedAt: string
}

// ── DTOs de API ───────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
