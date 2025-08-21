import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

export interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  userId?: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  headers: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
  error?: string;
  securityFlags: string[];
}

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityLoggingInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.configService.get<string>('ENABLE_SECURITY_LOGGING') !== 'true') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const securityEvent: Partial<SecurityEvent> = {
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(request),
      userAgent: request.get('User-Agent') || 'Unknown',
      method: request.method,
      url: request.url,
      userId: this.extractUserId(request),
      requestSize: parseInt(request.get('Content-Length') || '0'),
      headers: this.extractSecurityHeaders(request),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
      securityFlags: this.detectSecurityFlags(request),
    };

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const completedEvent: SecurityEvent = {
          ...securityEvent,
          statusCode: response.statusCode,
          responseTime,
          responseSize: this.calculateResponseSize(data),
        } as SecurityEvent;

        this.logSecurityEvent(completedEvent, 'SUCCESS');
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const errorEvent: SecurityEvent = {
          ...securityEvent,
          statusCode: error.status || 500,
          responseTime,
          responseSize: 0,
          error: error.message,
        } as SecurityEvent;

        this.logSecurityEvent(errorEvent, 'ERROR');
        throw error;
      }),
    );
  }

  private getClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      request.get('X-Real-IP') ||
      request.get('CF-Connecting-IP') ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private extractUserId(request: Request): string | undefined {
    const authHeader = request.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    return request.get('X-User-ID') || undefined;
  }

  private extractSecurityHeaders(request: Request): Record<string, string> {
    const securityHeaders = [
      'Origin',
      'Referer',
      'X-Forwarded-For',
      'X-Real-IP',
      'CF-Connecting-IP',
      'X-API-Key',
      'X-Requested-With',
    ];

    const headers: Record<string, string> = {};
    securityHeaders.forEach(header => {
      const value = request.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    return headers;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private detectSecurityFlags(request: Request): string[] {
    const flags: string[] = [];

    if (this.isSuspiciousUserAgent(request.get('User-Agent'))) {
      flags.push('SUSPICIOUS_USER_AGENT');
    }

    if (this.isSuspiciousIP(request.ip || 'unknown')) {
      flags.push('SUSPICIOUS_IP');
    }

    if (this.isRateLimitExceeded(request)) {
      flags.push('RATE_LIMIT_EXCEEDED');
    }

    if (this.containsMaliciousContent(request)) {
      flags.push('MALICIOUS_CONTENT');
    }

    if (this.isUnusualRequestPattern(request)) {
      flags.push('UNUSUAL_PATTERN');
    }

    return flags;
  }

  private isSuspiciousUserAgent(userAgent: string | undefined): boolean {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i,
      /ruby/i,
      /php/i,
      /go-http-client/i,
      /httpclient/i,
      /okhttp/i,
      /postman/i,
      /insomnia/i,
      /thunder client/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isSuspiciousIP(ip: string): boolean {
    const suspiciousIPs = [
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'localhost',
    ];

    return suspiciousIPs.includes(ip);
  }

  private isRateLimitExceeded(request: Request): boolean {
    return false;
  }

  private containsMaliciousContent(request: Request): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i,
      /confirm\(/i,
    ];

    const body = JSON.stringify(request.body || {});
    const query = JSON.stringify(request.query || {});
    const params = JSON.stringify(request.params || {});

    const allContent = `${body} ${query} ${params}`;

    return maliciousPatterns.some(pattern => pattern.test(allContent));
  }

  private isUnusualRequestPattern(request: Request): boolean {
    const unusualPatterns = [
      request.url.length > 1000,
      Object.keys(request.headers).length > 50,
      parseInt(request.get('Content-Length') || '0') > 5 * 1024 * 1024,
    ];

    return unusualPatterns.some(pattern => pattern);
  }

  private calculateResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private logSecurityEvent(event: SecurityEvent, type: 'SUCCESS' | 'ERROR'): void {
    const configuredLogLevel = this.configService.get<string>('SECURITY_LOG_LEVEL', 'info');
    const logLevel = type === 'ERROR' ? 'error' : 'log';
    const message = `Security Event [${type}]: ${event.method} ${event.url} - ${event.statusCode} (${event.responseTime}ms)`;
    
    const logData = {
      message,
      event,
      type,
    };

    if (this.shouldLog(configuredLogLevel, type)) {
      this.logger[logLevel](JSON.stringify(logData, null, 2));
    }
  }

  private shouldLog(configuredLevel: string, eventType: 'SUCCESS' | 'ERROR'): boolean {
    const levels = {
      'error': ['error'],
      'warn': ['error', 'warn'],
      'info': ['error', 'warn', 'info'],
      'debug': ['error', 'warn', 'info', 'debug'],
      'verbose': ['error', 'warn', 'info', 'debug', 'verbose'],
    };

    const allowedLevels = levels[configuredLevel] || levels['info'];
    const eventLevel = eventType === 'ERROR' ? 'error' : 'info';
    
    return allowedLevels.includes(eventLevel);
  }
}
