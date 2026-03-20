import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";
import { CriarFeriasDto } from "./dto/criar-ferias.dto";
import {
  StatusSolicitacao,
  TipoAfastamento,
  TipoFracionamento,
} from "@sisvac/types";

@Injectable()
export class FeriasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async criarSolicitacao(dto: CriarFeriasDto, userId: string) {
    const supabase = this.supabaseService.admin;

    // 1. Validações básicas e buscar Saldo
    if (dto.tipoAfastamento !== TipoAfastamento.LICENCA_ESPECIAL) {
      if (!dto.idSaldoFerias) {
        throw new BadRequestException(
          "ID do saldo de férias é obrigatório para Férias.",
        );
      }

      const { data: saldo, error: saldoErr } = await supabase
        .from("saldos_ferias")
        .select("*")
        .eq("id", dto.idSaldoFerias)
        .eq("id_matricula", dto.idMatricula)
        .single();

      if (saldoErr || !saldo) {
        throw new BadRequestException("Saldo de férias não encontrado.");
      }

      if (saldo.dias_disponiveis < dto.diasSolicitados) {
        throw new BadRequestException(
          "Dias solicitados excedem o saldo disponível.",
        );
      }

      // Validação de número de dias por tipo de fracionamento
      switch (dto.tipoFracionamento) {
        case TipoFracionamento.INTEGRAL:
          if (dto.diasSolicitados !== 30)
            throw new BadRequestException("Férias integrais exigem 30 dias.");
          break;
        case TipoFracionamento.QUINZE_QUINZE:
          if (dto.diasSolicitados !== 15)
            throw new BadRequestException("Fração de 15/15 exige 15 dias.");
          break;
        case TipoFracionamento.DEZ_VINTE:
          if (dto.diasSolicitados !== 10 && dto.diasSolicitados !== 20) {
            throw new BadRequestException(
              "Fração de 10/20 exige blocos de 10 ou 20 dias.",
            );
          }
          break;
        case TipoFracionamento.DEZ_DEZ_DEZ:
          if (dto.diasSolicitados !== 10)
            throw new BadRequestException(
              "Fração de 10/10/10 exige blocos de 10 dias.",
            );
          break;
      }

      // Validação do padrão de fracionamento (Não pode misturar 15/15 com 10/20 no mesmo exercício)
      const { data: solicitacoesAnteriores } = await supabase
        .from("solicitacoes")
        .select("tipo_fracionamento")
        .eq("id_saldo_ferias", dto.idSaldoFerias)
        .in("status", [StatusSolicitacao.PENDENTE, StatusSolicitacao.APROVADO]);

      if (solicitacoesAnteriores && solicitacoesAnteriores.length > 0) {
        const fracionamentoAnterior =
          solicitacoesAnteriores[0].tipo_fracionamento;
        if (fracionamentoAnterior !== dto.tipoFracionamento) {
          throw new BadRequestException(
            `As frações devem manter o padrão selecionado no primeiro período (${fracionamentoAnterior}).`,
          );
        }
      }
    } else {
      if (!dto.idSaldoLicenca) {
        throw new BadRequestException(
          "ID do saldo de licença é obrigatório para Licença Especial.",
        );
      }
      if (dto.diasSolicitados > 90) {
        throw new BadRequestException(
          "Licença especial tem o máximo de 90 dias.",
        );
      }
    }

    // 2. Validação de Sobreposição de Datas
    const { data: overlaps } = await supabase
      .from("solicitacoes")
      .select("id")
      .eq("id_matricula", dto.idMatricula)
      .in("status", [StatusSolicitacao.PENDENTE, StatusSolicitacao.APROVADO])
      .lte("data_inicio", dto.dataFim)
      .gte("data_fim", dto.dataInicio);

    if (overlaps && overlaps.length > 0) {
      throw new BadRequestException(
        "Já existe uma solicitação ou período agendado que coincide com estas datas.",
      );
    }

    // 3. Persistência
    const novaSolicitacao = {
      id_matricula: dto.idMatricula,
      id_exercicio: dto.idExercicio,
      id_saldo_ferias: dto.idSaldoFerias ?? null,
      id_saldo_licenca: dto.idSaldoLicenca ?? null,
      solicitado_por: userId,
      tipo_afastamento: dto.tipoAfastamento,
      tipo_fracionamento: dto.tipoFracionamento,
      data_inicio: dto.dataInicio,
      data_fim: dto.dataFim,
      dias_solicitados: dto.diasSolicitados,
      status: StatusSolicitacao.PENDENTE,
      observacoes: dto.observacoes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from("solicitacoes")
      .insert([novaSolicitacao])
      .select()
      .single();

    if (insertError) {
      throw new BadRequestException(
        `Erro ao criar solicitação: ${insertError.message}`,
      );
    }

    return insertData;
  }

  async cancelar(id: string, userId: string, userRole: any) {
    const supabase = this.supabaseService.admin;

    const { data: sol, error: solErr } = await supabase
      .from("solicitacoes")
      .select("solicitado_por, status")
      .eq("id", id)
      .single();

    if (solErr || !sol)
      throw new NotFoundException("Solicitação não encontrada.");

    // Regra de Ownership (Apenas dono ou Gestores podem cancelar)
    if (
      sol.solicitado_por !== userId &&
      userRole !== "ADMIN" &&
      userRole !== "RH"
    ) {
      throw new ForbiddenException(
        "Vocẽ não tem permissão para cancelar uma requisição que não te pertence.",
      );
    }

    // Regra de Integridade (Apenas Pendente pode ser cancelado via essa rota pelo Servidor)
    if (sol.status !== StatusSolicitacao.PENDENTE) {
      throw new BadRequestException(
        "Não é possível cancelar. Tente contatar o RH caso já esteja aprovado.",
      );
    }

    const { error: updErr } = await supabase
      .from("solicitacoes")
      .update({
        status: StatusSolicitacao.CANCELADO,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updErr)
      throw new BadRequestException("Não foi possível cancelar a solicitação.");

    // Registro na trilha
    await supabase.from("audit_log").insert({
      tabela: "solicitacoes",
      registro_id: id,
      acao: "CANCELAMENTO",
      usuario_id: userId,
      dados: {
        acao: "CANCELADO_PELO_SERVIDOR",
        isOwer: sol.solicitado_por === userId,
      },
      criado_em: new Date().toISOString(),
    });

    return { ok: true, status: StatusSolicitacao.CANCELADO };
  }
}
