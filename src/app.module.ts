require('dotenv').config();
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: isProduction || isStaging ? process.env.DATABASE_HOST : 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: isProduction ? ['dist/migrations/*{.ts,.js}'] : [],
      migrationsRun: isProduction,
      autoLoadEntities: !isProduction,
      synchronize: !isProduction && !isStaging,
      logging: !isProduction,
      ssl: isProduction || isStaging ? process.env.DATABASE_SSL === 'true' : false,
      extra: {
        ssl:
          isProduction || isStaging
            ? {
                rejectUnauthorized: false,
              }
            : null,
      },
      ...(isProduction && {
        poolSize: 20,
        acquireTimeout: 60000,
        timeout: 60000,
        keepConnectionAlive: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    RedisModule.forRoot({
      type: 'single',
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`,
      options: {
        password: process.env.REDIS_PASSWORD || undefined,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        ...(isProduction && {
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: false,
          maxLoadingTimeout: 10000,
          enableReadyCheck: true,
          autoResubscribe: true,
          autoResendUnfulfilledCommands: true,
        }),
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
