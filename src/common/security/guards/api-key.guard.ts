import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    const apiKey = request.get('X-API-Key');
    
    if (!apiKey) {
      this.logger.warn(`API key missing from request: ${request.ip} - ${request.url}`);
      throw new UnauthorizedException('API key is required');
    }

    if (!this.isValidApiKey(apiKey)) {
      this.logger.warn(`Invalid API key from: ${request.ip} - ${request.url}`);
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log(`API key validated for: ${request.ip} - ${request.url}`);
    
    return true;
  }

  private isValidApiKey(apiKey: string): boolean {
    const validApiKeys = this.configService.get<string>('VALID_API_KEYS', '');
    
    if (!validApiKeys) {
      this.logger.warn('No API keys configured in environment');
      return false;
    }

    const allowedKeys = validApiKeys.split(',').map(key => key.trim());
    
    return allowedKeys.includes(apiKey);
  }
}
