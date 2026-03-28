import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '../../leads/entities/leads.entity';

export class AiSummaryDto {
  @ApiPropertyOptional({ enum: LeadSource, description: 'Filtrar por fuente' })
  @IsOptional()
  @IsEnum(LeadSource)
  fuente?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}