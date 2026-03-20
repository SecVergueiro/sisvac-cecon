import { Controller, Post, Body, UseGuards, Patch, Param, Get, Res } from '@nestjs/common';
import { FeriasService } from './ferias.service';
import { FeriasPdfService } from './ferias-pdf.service';
import { CriarFeriasDto } from './dto/criar-ferias.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators';
import { UserRole } from '@sisvac/types';
import { Response } from 'express';

@Controller('ferias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeriasController {
  constructor(
    private readonly feriasService: FeriasService,
    private readonly feriasPdfService: FeriasPdfService
  ) {}

  @Post()
  @Roles(UserRole.SERVIDOR, UserRole.RH, UserRole.ADMIN)
  async criarSolicitacao(
    @Body() dto: CriarFeriasDto,
    @CurrentUser() user: any
  ) {
    return this.feriasService.criarSolicitacao(dto, user.id);
  }

  @Patch(':id/cancelar')
  @Roles(UserRole.SERVIDOR, UserRole.RH, UserRole.ADMIN)
  async cancelar(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.feriasService.cancelar(id, user.id, user.role);
  }

  @Get(':id/guia')
  @Roles(UserRole.SERVIDOR, UserRole.RH, UserRole.ADMIN)
  async emitirGuia(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const buffer = await this.feriasPdfService.gerarGuia(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="guia-ferias-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
