import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { AiModule } from './ai/ai.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                type: 'mssql',
                host: cfg.get<string>('DB_HOST', 'localhost'),
                port: parseInt(cfg.get<string>('DB_PORT', '1433'), 10),
                username: cfg.get<string>('DB_USERNAME'),
                password: cfg.get<string>('DB_PASSWORD'),
                database: cfg.get<string>('DB_DATABASE'),
                autoLoadEntities: true,
                synchronize: true,
                options: {
                    encrypt: cfg.get<string>('DB_ENCRYPT') === 'true',
                    trustServerCertificate: true,
                },
            }),
        }),

        AuthModule,
        LeadsModule,
        AiModule,
    ],
})
export class AppModule { }