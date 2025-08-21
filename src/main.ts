require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Main');

  const logLevels = (process.env.NESTJS_LOG_LEVELS?.split(',') || ['error', 'warn']) as Array<'error' | 'warn' | 'verbose' | 'debug' | 'log' | 'fatal'>;
  const enableLogging = process.env.ENABLE_LOGGING === 'true';
  
  const app = await NestFactory.create(AppModule, {
    logger: enableLogging ? logLevels : ['error', 'warn'],
  });

  const prefix = process.env.API_PREFIX || '';
  console.log('Setting global prefix:', prefix);
  app.setGlobalPrefix(prefix);

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Users', 'User profile management, preferences, and activity tracking')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = parseInt(process.env.BACKEND_PORT || '3000');
  await app.listen(port);
  logger.log(`Application is running on port: ${port}`);
}

bootstrap();
