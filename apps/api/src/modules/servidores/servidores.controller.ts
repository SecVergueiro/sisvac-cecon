import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ServidoresService } from "./servidores.service";
import { Roles, CurrentUser } from "../../auth/decorators/index";
import { UserRole } from "@sisvac/types";
import type { AuthenticatedUser } from "../../auth/strategies/jwt.strategy";

@Controller("servidores")
export class ServidoresController {
  constructor(private readonly service: ServidoresService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RH)
  findAll(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.service.findAll({ page: +page, limit: +limit });
  }

  @Get("meu-perfil")
  getMeuPerfil(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findById(user.id);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.RH)
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RH)
  create(@Body() body: any) {
    return this.service.criar(body);
  }
}
