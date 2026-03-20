import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";

@Injectable()
export class DashboardService {
  constructor(private supabase: SupabaseService) {}

  async getKpis() {
    const { data, error } = await this.supabase.admin
      .from("vw_dashboard_kpis")
      .select("*")
      .single();

    if (error)
      return { totalServidores: 0, emFerias: 0, pendentes: 0, saldoMedio: 0 };
    return data;
  }
}
