import { Module } from "@nestjs/common";
import { ServidoresController } from "./servidores.controller";
import { ServidoresService } from "./servidores.service";
import { SupabaseService } from "../../config/supabase.service";

@Module({
  controllers: [ServidoresController],
  providers: [ServidoresService, SupabaseService],
})
export class ServidoresModule {}
