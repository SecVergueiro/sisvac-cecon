export declare enum UserRole {
    ADMIN = "ADMIN",
    RH = "RH",
    SERVIDOR = "SERVIDOR"
}
export declare enum TipoVinculo {
    ESTATUTARIO = "ESTATUTARIO",
    CONTRATADO = "CONTRATADO",
    COMISSIONADO = "COMISSIONADO"
}
export declare enum StatusSolicitacao {
    PENDENTE = "PENDENTE",
    APROVADO = "APROVADO",
    REPROVADO = "REPROVADO",
    CANCELADO = "CANCELADO"
}
export interface Servidor {
    id: string;
    nome: string;
    cpf: string;
    matricula: string;
    cargo: string;
    setor: string;
    tipoVinculo: TipoVinculo;
    dataAdmissao: string;
    ativo: boolean;
}
export interface SaldoFerias {
    id: string;
    idMatricula: string;
    idExercicio: number;
    diasDevidos: number;
    diasGozados: number;
    diasSaldo: number;
}
export interface SolicitacaoFerias {
    id: string;
    idMatricula: string;
    dataInicio: string;
    dataFim: string;
    diasSolicitados: number;
    status: StatusSolicitacao;
    observacao?: string;
    criadoEm: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
