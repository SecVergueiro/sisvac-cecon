import { Module } from '@nestjs/common';
import { FeriasService } from './ferias.service';
import { FeriasController } from './ferias.controller';
import { FeriasPdfService } from './ferias-pdf.service';

@Module({
  controllers: [FeriasController],
  providers: [FeriasService, FeriasPdfService],
  exports: [FeriasService]
})
export class FeriasModule {}
