import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import cors from 'cors';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  private readonly helmetMiddleware = helmet();

  private rateLimiter: any;
  private speedLimiter: any;
  private hppMiddleware: any;
  private corsMiddleware: any;

  constructor(private readonly configService: ConfigService) {
    this.rateLimiter = rateLimit({
      windowMs: this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 900000),
      max: this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      // Use default keyGenerator without custom logic to avoid IPv6 warning
      // Default keyGenerator already handles IPv6 correctly
    });

    this.speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 50,
      delayMs: (used, req) => {
        const delayAfter = req.slowDown?.limit || 50;
        return (used - delayAfter) * 500;
      },
      maxDelayMs: 20000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      // Disable validation warning
      validate: {
        delayMs: false,
      },
    });

    this.hppMiddleware = hpp();

    this.corsMiddleware = cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8080',
          'https://pritzio.com',
          'https://app.pritzio.com',
        ];

        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          this.logger.warn(`Blocked request from unauthorized origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-API-Version'],
      maxAge: 86400,
      // Additional security options
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.logSecurityEvent(req);

    this.helmetMiddleware(req, res, () => {
      this.rateLimiter(req, res, () => {
        this.speedLimiter(req, res, () => {
          this.hppMiddleware(req, res, () => {
            this.corsMiddleware(req, res, () => {
              this.addSecurityHeaders(res);
              this.validateRequest(req, res, next);
            });
          });
        });
      });
    });
  }

  private logSecurityEvent(req: Request): void {
    // Sanitize and limit sensitive information in logs
    const securityInfo = {
      ip: this.sanitizeIP(req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress),
      userAgent: this.sanitizeUserAgent(req.get('User-Agent')),
      method: req.method,
      url: this.sanitizeURL(req.url),
      timestamp: new Date().toISOString(),
      headers: {
        origin: this.sanitizeOrigin(req.get('Origin')),
        referer: this.sanitizeReferer(req.get('Referer')),
        'x-forwarded-for': this.sanitizeIP(req.get('X-Forwarded-For')),
      },
    };

    this.logger.log(`Security event: ${JSON.stringify(securityInfo)}`);
  }

  private sanitizeIP(ip: string | undefined): string {
    if (!ip) return 'unknown';
    // Mask last octet for IPv4 and last 64 bits for IPv6 for privacy
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
      }
    } else if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:*`;
      }
    }
    return ip;
  }

  private sanitizeUserAgent(userAgent: string | undefined): string {
    if (!userAgent) return 'unknown';
    // Limit user agent length and remove potentially sensitive info
    return userAgent.substring(0, 100).replace(/[^\w\s\-\.\/\(\)]/g, '');
  }

  private sanitizeURL(url: string | undefined): string {
    if (!url) return 'unknown';
    // Remove query parameters that might contain sensitive data
    const cleanUrl = url.split('?')[0];
    return cleanUrl.length > 100 ? cleanUrl.substring(0, 100) + '...' : cleanUrl;
  }

  private sanitizeOrigin(origin: string | undefined): string {
    if (!origin) return 'none';
    // Only log domain, not full URL
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch {
      return 'invalid';
    }
  }

  private sanitizeReferer(referer: string | undefined): string {
    if (!referer) return 'none';
    // Only log domain, not full URL
    try {
      const url = new URL(referer);
      return url.hostname;
    } catch {
      return 'invalid';
    }
  }

  private addSecurityHeaders(res: Response): void {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    );
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Custom headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Powered-By', 'Pritzio Backend');
  }

  private validateRequest(req: Request, res: Response, next: NextFunction): void {
    // Validate payload size
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxPayloadSize = this.configService.get<number>('MAX_PAYLOAD_SIZE', 10485760);

    if (contentLength > maxPayloadSize) {
      const sanitizedIP = this.sanitizeIP(req.ip);
      this.logger.warn(`Request payload too large: ${contentLength} bytes from ${sanitizedIP}`);
      res.status(413).json({
        error: 'Payload too large',
        message: 'Request payload exceeds maximum allowed size',
        maxSize: '10MB',
      });
      return;
    }

    // Validate User-Agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      const sanitizedIP = this.sanitizeIP(req.ip);
      this.logger.warn(`Suspicious User-Agent: ${userAgent} from ${sanitizedIP}`);
      res.status(400).json({
        error: 'Invalid User-Agent',
        message: 'User-Agent header is required and must be valid',
      });
      return;
    }

    // Validate HTTP method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    if (!allowedMethods.includes(req.method)) {
      const sanitizedIP = this.sanitizeIP(req.ip);
      this.logger.warn(`Invalid HTTP method: ${req.method} from ${sanitizedIP}`);
      res.status(405).json({
        error: 'Method not allowed',
        message: `HTTP method ${req.method} is not allowed`,
        allowedMethods,
      });
      return;
    }

    // Validate request headers for potential injection attacks
    const suspiciousHeaders = this.detectSuspiciousHeaders(req);
    if (suspiciousHeaders.length > 0) {
      const sanitizedIP = this.sanitizeIP(req.ip);
      this.logger.warn(`Suspicious headers detected from ${sanitizedIP}: ${suspiciousHeaders.join(', ')}`);
      res.status(400).json({
        error: 'Suspicious headers detected',
        message: 'Request contains potentially malicious headers',
      });
      return;
    }

    next();
  }

  private detectSuspiciousHeaders(req: Request): string[] {
    const suspiciousHeaders: string[] = [];
    const headers = req.headers;

    // Check for potential injection patterns
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /onclick/i,
      /onmouseover/i,
      /eval\(/i,
      /expression\(/i,
      /url\(/i,
    ];

    // Check all headers for suspicious content
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        for (const pattern of injectionPatterns) {
          if (pattern.test(value)) {
            suspiciousHeaders.push(`${key}: ${value.substring(0, 50)}...`);
            break;
          }
        }
      }
    });

    return suspiciousHeaders;
  }
}
