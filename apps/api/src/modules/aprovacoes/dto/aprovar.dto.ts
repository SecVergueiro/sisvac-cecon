import { IsString, IsOptional } from "class-validator";

export class AprovarDto {
  @IsString()
  @IsOptional()
  observacoes?: string;
}

export class NegarDto {
  @IsString()
  @IsOptional() // Opcional ou required dependendo da regra, geralmente required para negar
  justificativa?: string;
}
