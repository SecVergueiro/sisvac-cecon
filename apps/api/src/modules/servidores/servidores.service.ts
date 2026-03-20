import { Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";

@Injectable()
export class ServidoresService {
  constructor(private supabase: SupabaseService) {}

  async findAll({ page, limit }: { page: number; limit: number }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase.admin
      .from("funcionarios")
      .select(
        "*, matriculas(matricula, cargo:cargos(nome), setor:setores(nome))",
        { count: "exact" },
      )
      .range(from, to)
      .order("nome");

    if (error) throw new Error(error.message);

    return { data, total: count ?? 0, page, limit };
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from("funcionarios")
      .select("*, matriculas(*, cargo:cargos(nome), setor:setores(nome))")
      .eq("id", id)
      .single();

    if (error || !data) throw new NotFoundException("Servidor não encontrado");
    return data;
  }

  async criar(body: any) {
    const { data, error } = await this.supabase.admin.rpc(
      "fn_cadastrar_servidor",
      {
        p_nome: body.nome,
        p_cpf: body.cpf,
        p_matricula: body.matricula,
        p_id_cargo: body.idCargo,
        p_id_setor: body.idSetor,
        p_tipo_vinculo: body.tipoVinculo,
        p_data_admissao: body.dataAdmissao,
      },
    );

    if (error) throw new Error(error.message);
    return { id: data };
  }
}
