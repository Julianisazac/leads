import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { LeadsService } from '../leads/leads.service';
import { AiSummaryDto } from './dto/ai-summary.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leads/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly leadsService: LeadsService,
  ) {}

  @Post('summary')
  @ApiOperation({
    summary: 'Genera un resumen ejecutivo de leads usando IA',
    description:
      'Filtra leads y genera análisis con fuente principal y recomendaciones. ' +
      'Con AI_MOCK=true retorna respuesta simulada sin costo.',
  })
  @ApiResponse({ status: 201, description: 'Resumen generado' })
  async summary(@Body() dto: AiSummaryDto) {
    const leads = await this.leadsService.findWithFilters(
      dto.fuente,
      dto.fecha_inicio,
      dto.fecha_fin,
    );
    return this.aiService.generateSummary(leads);
  }
}