import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Middleware
import { SecurityMiddleware } from './middleware/security.middleware';

// Guards
import { ApiKeyGuard } from './guards/api-key.guard';

// Interceptors
import { ValidationInterceptor } from './interceptors/validation.interceptor';
import { SecurityLoggingInterceptor } from './interceptors/security-logging.interceptor';

// Decorators
export * from './decorators/security.decorators';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SecurityMiddleware,
    ApiKeyGuard,
    ValidationInterceptor,
    SecurityLoggingInterceptor,
  ],
  exports: [
    SecurityMiddleware,
    ApiKeyGuard,
    ValidationInterceptor,
    SecurityLoggingInterceptor,
  ],
})
export class SecurityModule {}
