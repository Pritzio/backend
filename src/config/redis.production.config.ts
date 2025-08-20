import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const redisProductionConfig: RedisModuleOptions = {
  type: 'single',
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`,
  options: {
    password: process.env.REDIS_PASSWORD,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
  },
};
