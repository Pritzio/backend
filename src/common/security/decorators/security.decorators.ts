import { SetMetadata, UseGuards, UseInterceptors, applyDecorators } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { SecurityLoggingInterceptor } from '../interceptors/security-logging.interceptor';
import { ValidationInterceptor } from '../interceptors/validation.interceptor';

export const SECURITY_LEVEL_KEY = 'securityLevel';
export const RATE_LIMIT_KEY = 'rateLimit';
export const SANITIZATION_KEY = 'sanitization';

export enum SecurityLevel {
  PUBLIC = 'public',
  BASIC = 'basic',
  STRICT = 'strict',
  API_KEY = 'api_key',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const SecurityLevelDecorator = (level: SecurityLevel) => SetMetadata(SECURITY_LEVEL_KEY, level);

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

export const Sanitization = (enabled: boolean = true) => SetMetadata(SANITIZATION_KEY, enabled);

export const BasicSecurity = () => applyDecorators(
  UseInterceptors(ValidationInterceptor, SecurityLoggingInterceptor),
  SecurityLevelDecorator(SecurityLevel.BASIC)
);

export const StrictSecurity = () => applyDecorators(
  UseInterceptors(ValidationInterceptor, SecurityLoggingInterceptor),
  SecurityLevelDecorator(SecurityLevel.STRICT)
);

export const ApiKeyProtected = () => applyDecorators(
  UseGuards(ApiKeyGuard),
  UseInterceptors(ValidationInterceptor, SecurityLoggingInterceptor),
  SecurityLevelDecorator(SecurityLevel.API_KEY)
);

export const AdminOnly = () => applyDecorators(
  UseInterceptors(ValidationInterceptor, SecurityLoggingInterceptor),
  SecurityLevelDecorator(SecurityLevel.ADMIN)
);

export const SystemOnly = () => applyDecorators(
  UseInterceptors(ValidationInterceptor, SecurityLoggingInterceptor),
  SecurityLevelDecorator(SecurityLevel.SYSTEM)
);

export const ValidatePayload = () => UseInterceptors(ValidationInterceptor);

export const SecurityLogging = () => UseInterceptors(SecurityLoggingInterceptor);

export const CustomCors = (origins: string[]) => {
  return SetMetadata('customCors', origins);
};

export const SecurityHeaders = (headers: Record<string, string>) => {
  return SetMetadata('securityHeaders', headers);
};

export const AllowedIPs = (ips: string[]) => {
  return SetMetadata('allowedIPs', ips);
};

export const AllowedUserAgents = (userAgents: string[]) => {
  return SetMetadata('allowedUserAgents', userAgents);
};

export const MaxPayloadSize = (sizeInBytes: number) => {
  return SetMetadata('maxPayloadSize', sizeInBytes);
};

export const ContentValidation = (rules: {
  allowHtml?: boolean;
  allowScripts?: boolean;
  maxLength?: number;
  allowedTags?: string[];
}) => {
  return SetMetadata('contentValidation', rules);
};
