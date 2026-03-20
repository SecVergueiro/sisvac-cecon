import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AprovacoesService } from './aprovacoes.service';
import { AprovarDto, NegarDto } from './dto/aprovar.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '@sisvac/types';

@Controller('aprovacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AprovacoesController {
  constructor(private readonly aprovacoesService: AprovacoesService) {}

  @Patch(':id/aprovar')
  @Roles(UserRole.RH, UserRole.ADMIN)
  async aprovar(
    @Param('id') id: string,
    @Body() dto: AprovarDto,
    @CurrentUser() user: any
  ) {
    return this.aprovacoesService.aprovar(id, dto, user.id, user.role);
  }

  @Patch(':id/negar')
  @Roles(UserRole.RH, UserRole.ADMIN)
  async negar(
    @Param('id') id: string,
    @Body() dto: NegarDto,
    @CurrentUser() user: any
  ) {
    return this.aprovacoesService.negar(id, dto, user.id);
  }
}
