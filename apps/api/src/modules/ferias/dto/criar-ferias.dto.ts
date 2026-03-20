import { IsString, IsInt, IsUUID, IsEnum, IsOptional, Min } from 'class-validator';
import { TipoAfastamento, TipoFracionamento } from '@sisvac/types';

export class CriarFeriasDto {
  @IsString()
  idMatricula: string;

  @IsInt()
  idExercicio: number;

  @IsUUID()
  @IsOptional()
  idSaldoFerias?: string;

  @IsUUID()
  @IsOptional()
  idSaldoLicenca?: string;

  @IsEnum(TipoAfastamento)
  tipoAfastamento: TipoAfastamento;

  @IsEnum(TipoFracionamento)
  tipoFracionamento: TipoFracionamento;

  @IsString()
  dataInicio: string;

  @IsString()
  dataFim: string;

  @IsInt()
  @Min(1)
  diasSolicitados: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
