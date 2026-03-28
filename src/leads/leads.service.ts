import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Lead } from './entities/leads.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto, QueryLeadsDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    const exists = await this.leadRepo.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un lead con el email ${dto.email}`,
      );
    }
    const lead = this.leadRepo.create(dto);
    return this.leadRepo.save(lead);
  }

  async findAll(query: QueryLeadsDto) {
    const { page = 1, limit = 10, fuente, fecha_inicio, fecha_fin } = query;

    const qb = this.leadRepo
      .createQueryBuilder('lead')
      .where('lead.deleted_at IS NULL')
      .orderBy('lead.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (fuente) {
      qb.andWhere('lead.fuente = :fuente', { fuente });
    }

    if (fecha_inicio && fecha_fin) {
      qb.andWhere('lead.created_at BETWEEN :inicio AND :fin', {
        inicio: new Date(fecha_inicio),
        fin: new Date(fecha_fin + 'T23:59:59'),
      });
    } else if (fecha_inicio) {
      qb.andWhere('lead.created_at >= :inicio', {
        inicio: new Date(fecha_inicio),
      });
    } else if (fecha_fin) {
      qb.andWhere('lead.created_at <= :fin', {
        fin: new Date(fecha_fin + 'T23:59:59'),
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead con id ${id} no encontrado`);
    return lead;
  }

  async update(id: number, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);

    if (dto.email && dto.email !== lead.email) {
      const emailExists = await this.leadRepo.findOne({
        where: { email: dto.email },
        withDeleted: true,
      });
      if (emailExists) {
        throw new ConflictException(
          `Ya existe un lead con el email ${dto.email}`,
        );
      }
    }

    Object.assign(lead, dto);
    return this.leadRepo.save(lead);
  }

  async remove(id: number): Promise<{ message: string }> {
    const lead = await this.findOne(id);
    await this.leadRepo.softRemove(lead);
    return { message: `Lead ${id} eliminado correctamente` };
  }

  async getStats() {
    const total = await this.leadRepo.count();

    const bySource = await this.leadRepo
      .createQueryBuilder('lead')
      .select('lead.fuente', 'fuente')
      .addSelect('COUNT(*)', 'total')
      .where('lead.deleted_at IS NULL')
      .groupBy('lead.fuente')
      .getRawMany();

    const avgResult = await this.leadRepo
      .createQueryBuilder('lead')
      .select('AVG(CAST(lead.presupuesto AS FLOAT))', 'avg')
      .where('lead.deleted_at IS NULL')
      .andWhere('lead.presupuesto IS NOT NULL')
      .getRawOne();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const lastWeek = await this.leadRepo.count({
      where: { created_at: MoreThanOrEqual(sevenDaysAgo) },
    });

    return {
      total_leads: total,
      leads_por_fuente: bySource.map((r) => ({
        fuente: r.fuente,
        total: Number(r.total),
      })),
      promedio_presupuesto: avgResult?.avg
        ? Number(Number(avgResult.avg).toFixed(2))
        : null,
      leads_ultimos_7_dias: lastWeek,
    };
  }

  async findWithFilters(
    fuente?: string,
    fecha_inicio?: string,
    fecha_fin?: string,
  ): Promise<Lead[]> {
    const qb = this.leadRepo
      .createQueryBuilder('lead')
      .where('lead.deleted_at IS NULL')
      .orderBy('lead.created_at', 'DESC');

    if (fuente) qb.andWhere('lead.fuente = :fuente', { fuente });
    if (fecha_inicio && fecha_fin) {
      qb.andWhere('lead.created_at BETWEEN :inicio AND :fin', {
        inicio: new Date(fecha_inicio),
        fin: new Date(fecha_fin + 'T23:59:59'),
      });
    } else if (fecha_inicio) {
      qb.andWhere('lead.created_at >= :inicio', {
        inicio: new Date(fecha_inicio),
      });
    } else if (fecha_fin) {
      qb.andWhere('lead.created_at <= :fin', {
        fin: new Date(fecha_fin + 'T23:59:59'),
      });
    }

    return qb.getMany();
  }

  async processWebhook(payload: any): Promise<Lead> {
    const dto: CreateLeadDto = {
      nombre: payload.nombre ?? payload.name ?? 'Sin nombre',
      email: payload.email,
      telefono: payload.telefono ?? payload.phone ?? null,
      fuente: payload.fuente ?? 'otro',
      producto_interes: payload.producto_interes ?? null,
      presupuesto: payload.presupuesto ?? null,
    };
    return this.create(dto);
  }
}