import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseProductionConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  migrationsRun: true,
  autoLoadEntities: false,
  synchronize: false,
  logging: false,
  ssl: process.env.DATABASE_SSL === 'true',
  extra: {
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : null,
  },
        poolSize: 20,
      retryAttempts: 10,
      retryDelay: 3000,
};
