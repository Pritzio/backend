require('dotenv').config();
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TestController } from './test.controller';

const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'pritzio_user',
      password: 'pritzio_password',
      database: 'pritzio',
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
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
    AuthModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
