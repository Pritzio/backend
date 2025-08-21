require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule, {
    logger: process.env.ENABLE_LOGGING === 'true' ? ['log', 'error', 'warn', 'debug', 'verbose'] : ['error', 'warn'],
  });

  // Global prefix
  const prefix = process.env.API_PREFIX || '';
  console.log('Setting global prefix:', prefix);
  app.setGlobalPrefix(prefix);

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
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

  // Swagger documentation
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Pritzio API')
      .setDescription('Backend API for Pritzio - Price comparison platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('products', 'Product catalog')
      .addTag('prices', 'Price management')
      .addTag('locations', 'Geolocation services')
      .addTag('social', 'Social features')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = parseInt(process.env.BACKEND_PORT || '3000');
  await app.listen(port);
  logger.log(`Application is running on port: ${port}`);
}

bootstrap();
