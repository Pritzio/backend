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
      keyGenerator: (req) => {
        return `${req.ip}-${req.get('User-Agent')}`;
      },
    });

    this.speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 50,
      delayMs: 500,
      maxDelayMs: 20000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
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

        if (!origin) {
          return callback(null, true);
        }

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
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400,
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
    const securityInfo = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      headers: {
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
      },
    };

    this.logger.log(`Security event: ${JSON.stringify(securityInfo)}`);
  }

  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Powered-By', 'Pritzio Backend');
  }

  private validateRequest(req: Request, res: Response, next: NextFunction): void {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxPayloadSize = this.configService.get<number>('MAX_PAYLOAD_SIZE', 10485760);

    if (contentLength > maxPayloadSize) {
      this.logger.warn(`Request payload too large: ${contentLength} bytes from ${req.ip}`);
      res.status(413).json({
        error: 'Payload too large',
        message: 'Request payload exceeds maximum allowed size',
        maxSize: '10MB',
      });
      return;
    }

    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      this.logger.warn(`Suspicious User-Agent: ${userAgent} from ${req.ip}`);
      res.status(400).json({
        error: 'Invalid User-Agent',
        message: 'User-Agent header is required and must be valid',
      });
      return;
    }

    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    if (!allowedMethods.includes(req.method)) {
      this.logger.warn(`Invalid HTTP method: ${req.method} from ${req.ip}`);
      res.status(405).json({
        error: 'Method not allowed',
        message: `HTTP method ${req.method} is not allowed`,
        allowedMethods,
      });
      return;
    }

    next();
  }
}
