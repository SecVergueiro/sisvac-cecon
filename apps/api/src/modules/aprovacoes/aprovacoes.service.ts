import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { AprovarDto, NegarDto } from './dto/aprovar.dto';
import { StatusSolicitacao, TipoAfastamento, UserRole } from '@sisvac/types';

@Injectable()
export class AprovacoesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async aprovar(id: string, dto: AprovarDto, userId: string, userRole: UserRole) {
    const supabase = this.supabaseService.admin;

    // 1. Busca da solicitação pendente
    const { data: solicitacao, error: solErr } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (solErr || !solicitacao) throw new BadRequestException('Solicitação não encontrada.');
    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser aprovadas.');
    }

    // 2. Desconto do saldo (caso de Férias)
    if (solicitacao.tipo_afastamento !== TipoAfastamento.LICENCA_ESPECIAL && solicitacao.id_saldo_ferias) {
      const { data: saldo } = await supabase
        .from('saldos_ferias')
        .select('id, dias_utilizados, dias_disponiveis')
        .eq('id', solicitacao.id_saldo_ferias)
        .single();

      if (saldo) {
        const novoUtilizados = (saldo.dias_utilizados || 0) + solicitacao.dias_solicitados;
        const novoDisponiveis = (saldo.dias_disponiveis || 0) - solicitacao.dias_solicitados;

        const { error: updErr } = await supabase
          .from('saldos_ferias')
          .update({
            dias_utilizados: novoUtilizados,
            dias_disponiveis: novoDisponiveis,
          })
          .eq('id', saldo.id);

        if (updErr) throw new BadRequestException('Erro ao descontar o saldo de férias.');
      }
    } else if (solicitacao.tipo_afastamento === TipoAfastamento.LICENCA_ESPECIAL && solicitacao.id_saldo_licenca) {
      // Caso genérico adaptado para licença se existir saldo licença (id_saldo_licenca)
      const { data: saldoLic } = await supabase
        .from('saldos_licenca')
        .select('*')
        .eq('id', solicitacao.id_saldo_licenca)
        .single();

      if (saldoLic) {
        await supabase
          .from('saldos_licenca')
          .update({
            dias_utilizados: (saldoLic.dias_utilizados || 0) + solicitacao.dias_solicitados,
            dias_disponiveis: (saldoLic.dias_disponiveis || 0) - solicitacao.dias_solicitados,
          })
          .eq('id', saldoLic.id);
      }
    }

    // 3. Atualização do status
    const updatePayload: any = {
      status: StatusSolicitacao.APROVADO,
      observacoes: dto.observacoes ?? solicitacao.observacoes ?? null,
      updated_at: new Date().toISOString()
    };

    if (userRole === UserRole.RH) {
      updatePayload.aprovado_rh_por = userId;
      updatePayload.aprovado_rh_em = new Date().toISOString();
    } else {
      updatePayload.aprovado_chefia_por = userId;
      updatePayload.aprovado_chefia_em = new Date().toISOString();
    }

    const { error: updSolErr } = await supabase.from('solicitacoes').update(updatePayload).eq('id', id);
    if (updSolErr) throw new BadRequestException('Falha ao atualizar o status da aprovação.');

    // 4. Audit Log
    await supabase.from('audit_log').insert({
      tabela: 'solicitacoes',
      registro_id: id,
      acao: 'APROVACAO',
      usuario_id: userId,
      dados: updatePayload,
      criado_em: new Date().toISOString()
    });

    return { ok: true, status: StatusSolicitacao.APROVADO };
  }

  async negar(id: string, dto: NegarDto, userId: string) {
    const supabase = this.supabaseService.admin;

    const { data: solicitacao } = await supabase
      .from('solicitacoes')
      .select('status')
      .eq('id', id)
      .single();

    if (!solicitacao || solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser negadas.');
    }

    const payload = {
      status: StatusSolicitacao.REPROVADO,
      negado_por: userId,
      negado_em: new Date().toISOString(),
      justificativa_negacao: dto.justificativa ?? null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('solicitacoes').update(payload).eq('id', id);
    if (error) throw new BadRequestException('Não foi possível negar a requisição.');

    // Audit Log
    await supabase.from('audit_log').insert({
      tabela: 'solicitacoes',
      registro_id: id,
      acao: 'REPROVACAO',
      usuario_id: userId,
      dados: payload,
      criado_em: new Date().toISOString()
    });

    return { ok: true };
  }
}
