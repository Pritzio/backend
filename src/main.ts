import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: appConfig.enableLogging ? ['log', 'error', 'warn', 'debug', 'verbose'] : ['error', 'warn'],
  });

  // Global prefix
  app.setGlobalPrefix(appConfig.apiPrefix);

  // CORS
  app.enableCors({
    origin: appConfig.corsOrigin,
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
  if (appConfig.enableSwagger) {
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

  await app.listen(appConfig.port);
  
  console.log(`🚀 Pritzio Backend running on port ${appConfig.port}`);
  console.log(`📚 API Documentation: http://localhost:${appConfig.port}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${appConfig.port}/health`);
}

bootstrap();
