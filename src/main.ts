require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Main');

  const logLevels = (process.env.NESTJS_LOG_LEVELS?.split(',') || [
    'error',
    'warn',
  ]) as Array<'error' | 'warn' | 'verbose' | 'debug' | 'log' | 'fatal'>;
  const enableLogging = process.env.ENABLE_LOGGING === 'true';

  const app = await NestFactory.create(AppModule, {
    logger: enableLogging ? logLevels : ['error', 'warn'],
  });

  const prefix = process.env.API_PREFIX || '';
  if (prefix) {
    app.setGlobalPrefix(prefix, {
      exclude: [
        { path: 'health', method: RequestMethod.GET },
        { path: '', method: RequestMethod.GET },
      ],
    });
  }

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];

  if (process.env.NODE_ENV === 'development' || corsOrigins.length === 0) {
    app.enableCors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
      ],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  } else {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporarily disable to debug
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Pritzio API')
      .setDescription('Backend API for Pritzio - Price comparison platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag(
        'Authentication',
        'User authentication and authorization endpoints',
      )
      .addTag(
        'Users',
        'User profile management, preferences, and activity tracking',
      )
      .addTag('Stores', 'Store management, physical locations, and analytics')
      .addTag('Products', 'Master product management, categories, and brands')
      .addTag(
        'Store Products',
        'Store-specific products with scraping and price tracking',
      )
      .addTag(
        'Physical Locations',
        'Geolocation, business hours, and capacity management',
      )
      .addTag('Scraping', 'Web scraping endpoints for product data extraction')
      .addTag(
        'Statistics',
        'System statistics and analytics for users, stores, and products',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = parseInt(process.env.BACKEND_PORT || '3000');
  await app.listen(port);
  logger.log(`Application is running on port: ${port}`);
}

bootstrap();
