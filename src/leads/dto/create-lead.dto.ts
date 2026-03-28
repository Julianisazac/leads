import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '../entities/leads.entity';

export class CreateLeadDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiPropertyOptional({ example: '+57 310 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: LeadSource, example: LeadSource.INSTAGRAM })
  @IsEnum(LeadSource, {
    message: `La fuente debe ser uno de: ${Object.values(LeadSource).join(', ')}`,
  })
  fuente: LeadSource;

  @ApiPropertyOptional({ example: 'Curso de marketing digital' })
  @IsOptional()
  @IsString()
  producto_interes?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  presupuesto?: number;
}