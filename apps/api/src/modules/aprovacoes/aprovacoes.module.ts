import { Module } from "@nestjs/common";
import { AprovacoesController } from "./aprovacoes.controller";
import { AprovacoesService } from "./aprovacoes.service";

@Module({
  controllers: [AprovacoesController],
  providers: [AprovacoesService],
  exports: [AprovacoesService],
})
export class AprovacoesModule {}
