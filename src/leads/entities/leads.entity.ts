import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum LeadSource {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LANDING_PAGE = 'landing_page',
  REFERIDO = 'referido',
  OTRO = 'otro',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Index({ unique: true })
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 50 })
  fuente: LeadSource;

  @Column({ length: 500, nullable: true })
  producto_interes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  presupuesto: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date;
}