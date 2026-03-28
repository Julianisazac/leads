import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Lead, LeadSource } from '../../leads/entities/leads.entity';
import { User } from '../../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USERNAME ?? 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE ?? 'omc_leads',
  entities: [Lead, User],
  synchronize: false,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});

const leads = [
  { nombre: 'Laura Martínez', email: 'laura.martinez@example.com', telefono: '+57 311 111 0001', fuente: LeadSource.INSTAGRAM, producto_interes: 'Curso de marketing digital', presupuesto: 300 },
  { nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@example.com', telefono: '+57 311 111 0002', fuente: LeadSource.FACEBOOK, producto_interes: 'Mentoría 1:1', presupuesto: 800 },
  { nombre: 'Valentina Torres', email: 'valentina.torres@example.com', telefono: '+57 311 111 0003', fuente: LeadSource.LANDING_PAGE, producto_interes: 'Curso de ventas online', presupuesto: 150 },
  { nombre: 'Andrés Gómez', email: 'andres.gomez@example.com', telefono: null, fuente: LeadSource.REFERIDO, producto_interes: 'Membresía mensual', presupuesto: 50 },
  { nombre: 'Isabella Pérez', email: 'isabella.perez@example.com', telefono: '+57 311 111 0005', fuente: LeadSource.INSTAGRAM, producto_interes: 'Pack de plantillas', presupuesto: 80 },
  { nombre: 'Sebastián López', email: 'sebastian.lopez@example.com', telefono: '+57 311 111 0006', fuente: LeadSource.FACEBOOK, producto_interes: 'Curso de copywriting', presupuesto: 200 },
  { nombre: 'Camila Herrera', email: 'camila.herrera@example.com', telefono: null, fuente: LeadSource.LANDING_PAGE, producto_interes: 'Consultoría estratégica', presupuesto: 1200 },
  { nombre: 'Diego Ramírez', email: 'diego.ramirez@example.com', telefono: '+57 311 111 0008', fuente: LeadSource.OTRO, producto_interes: null, presupuesto: null },
  { nombre: 'Sofía Díaz', email: 'sofia.diaz@example.com', telefono: '+57 311 111 0009', fuente: LeadSource.INSTAGRAM, producto_interes: 'Curso de redes sociales', presupuesto: 120 },
  { nombre: 'Miguel Vargas', email: 'miguel.vargas@example.com', telefono: '+57 311 111 0010', fuente: LeadSource.REFERIDO, producto_interes: 'Programa completo', presupuesto: 2500 },
  { nombre: 'Natalia Castro', email: 'natalia.castro@example.com', telefono: null, fuente: LeadSource.FACEBOOK, producto_interes: 'E-book premium', presupuesto: 30 },
  { nombre: 'Felipe Ortega', email: 'felipe.ortega@example.com', telefono: '+57 311 111 0012', fuente: LeadSource.LANDING_PAGE, producto_interes: 'Taller en vivo', presupuesto: 90 },
];

async function seed() {
  await AppDataSource.initialize();

  const leadRepo = AppDataSource.getRepository(Lead);
  const userRepo = AppDataSource.getRepository(User);

  let created = 0;
  for (const data of leads) {
    const exists = await leadRepo.findOne({ where: { email: data.email } });
    if (!exists) {
      await leadRepo.save(leadRepo.create(data));
      created++;
    }
  }

  const demoEmail = 'admin@omc.com';
  const userExists = await userRepo.findOne({ where: { email: demoEmail } });
  if (!userExists) {
    const hash = await bcrypt.hash('Admin1234!', 10);
    await userRepo.save(
      userRepo.create({ nombre: 'Admin OMC', email: demoEmail, password: hash }),
    );
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  process.exit(1);
});