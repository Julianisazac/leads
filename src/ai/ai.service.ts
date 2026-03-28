import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Lead } from '../leads/entities/leads.entity';

export interface AiSummaryResult {
  resumen: string;
  fuente_principal: string | null;
  total_leads_analizados: number;
  generado_con: string;
  mock: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly cfg: ConfigService) {}

  async generateSummary(leads: Lead[]): Promise<AiSummaryResult> {
    const isMock = this.cfg.get<string>('AI_MOCK') !== 'false';

    if (isMock) return this.mockSummary(leads);

    const provider = this.cfg.get<string>('AI_PROVIDER', 'anthropic');
    if (provider === 'anthropic') return this.anthropicSummary(leads);
    if (provider === 'openai') return this.openaiSummary(leads);

    return this.mockSummary(leads);
  }

  private mockSummary(leads: Lead[]): AiSummaryResult {
    if (leads.length === 0) {
      return {
        resumen:
          'No hay leads que coincidan con los filtros proporcionados. ' +
          'Se recomienda ampliar el rango de fechas o revisar los canales activos.',
        fuente_principal: null,
        total_leads_analizados: 0,
        generado_con: 'mock',
        mock: true,
      };
    }

    const fuenteCount: Record<string, number> = {};
    let totalPresupuesto = 0;
    let countConPresupuesto = 0;

    for (const lead of leads) {
      fuenteCount[lead.fuente] = (fuenteCount[lead.fuente] ?? 0) + 1;
      if (lead.presupuesto) {
        totalPresupuesto += Number(lead.presupuesto);
        countConPresupuesto++;
      }
    }

    const fuentePrincipal = Object.entries(fuenteCount).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const avgPresupuesto =
      countConPresupuesto > 0
        ? (totalPresupuesto / countConPresupuesto).toFixed(2)
        : 'no disponible';

    const resumen =
      `[MOCK — respuesta simulada]\n\n` +
      `Se analizaron ${leads.length} lead(s). ` +
      `El canal principal de captación es "${fuentePrincipal}" con ${fuenteCount[fuentePrincipal]} lead(s). ` +
      `El presupuesto promedio es USD ${avgPresupuesto}.\n\n` +
      `Recomendaciones:\n` +
      `• Fortalecer la inversión en "${fuentePrincipal}" dado su alto volumen.\n` +
      `• Hacer seguimiento prioritario a los ${countConPresupuesto} leads con presupuesto declarado.\n` +
      `• Activar nurturing para leads sin presupuesto declarado.\n\n` +
      `Para IA real configure AI_MOCK=false y agregue ANTHROPIC_API_KEY o OPENAI_API_KEY en .env`;

    return {
      resumen,
      fuente_principal: fuentePrincipal,
      total_leads_analizados: leads.length,
      generado_con: 'mock',
      mock: true,
    };
  }

  private async anthropicSummary(leads: Lead[]): Promise<AiSummaryResult> {
    const apiKey = this.cfg.get<string>('ANTHROPIC_API_KEY');
    const model = this.cfg.get<string>('AI_MODEL', 'claude-sonnet-4-20250514');
    const prompt = this.buildPrompt(leads);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Anthropic API error: ${err}`);
      throw new Error('Error al contactar la API de Anthropic');
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? '';

    return {
      resumen: text,
      fuente_principal: this.extractFuentePrincipal(leads),
      total_leads_analizados: leads.length,
      generado_con: `anthropic/${model}`,
      mock: false,
    };
  }

  private async openaiSummary(leads: Lead[]): Promise<AiSummaryResult> {
    const apiKey = this.cfg.get<string>('OPENAI_API_KEY');
    const model = this.cfg.get<string>('AI_MODEL', 'gpt-4o');
    const prompt = this.buildPrompt(leads);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`OpenAI API error: ${err}`);
      throw new Error('Error al contactar la API de OpenAI');
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';

    return {
      resumen: text,
      fuente_principal: this.extractFuentePrincipal(leads),
      total_leads_analizados: leads.length,
      generado_con: `openai/${model}`,
      mock: false,
    };
  }

  private buildPrompt(leads: Lead[]): string {
    const resumen = leads.map((l) => ({
      nombre: l.nombre,
      fuente: l.fuente,
      producto_interes: l.producto_interes ?? 'no especificado',
      presupuesto: l.presupuesto ? `USD ${l.presupuesto}` : 'no especificado',
      fecha: l.created_at?.toISOString().split('T')[0],
    }));

    return (
      `Eres un analista de marketing digital. Analiza los siguientes ${leads.length} leads ` +
      `y genera un resumen ejecutivo en español que incluya:\n` +
      `1. Análisis general\n` +
      `2. Fuente principal de captación\n` +
      `3. Tres recomendaciones concretas\n\n` +
      `Datos:\n${JSON.stringify(resumen, null, 2)}`
    );
  }

  private extractFuentePrincipal(leads: Lead[]): string | null {
    if (!leads.length) return null;
    const count: Record<string, number> = {};
    for (const l of leads) count[l.fuente] = (count[l.fuente] ?? 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  }
}