import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ValidationInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { body, query, params } = request;

    try {
      if (body && Object.keys(body).length > 0) {
        const sanitizedBody = this.sanitizeData(body);
        request.body = sanitizedBody;

        await this.validateData(sanitizedBody, 'Body');
      }

      if (query && Object.keys(query).length > 0) {
        const sanitizedQuery = this.sanitizeData(query);
        request.query = sanitizedQuery;

        await this.validateData(sanitizedQuery, 'Query');
      }

      if (params && Object.keys(params).length > 0) {
        const sanitizedParams = this.sanitizeData(params);
        request.params = sanitizedParams;

        await this.validateData(sanitizedParams, 'Params');
      }

      return next.handle();
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedKey = this.sanitizeString(key);

        if (value !== null && value !== undefined) {
          sanitized[sanitizedKey] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    let sanitized = str
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '')
      .replace(/file:\/\//gi, '')
      .replace(/ftp:\/\//gi, '')
      .trim();

    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  private async validateData(data: any, context: string): Promise<void> {
    if (!data || typeof data !== 'object') {
      return;
    }

    const dtoClass = this.getDtoClass(data);

    if (dtoClass) {
      const dtoInstance = plainToClass(dtoClass, data, {
        excludeExtraneousValues: true,
        exposeUnsetFields: false,
      });

      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
        validationError: {
          target: false,
          value: false,
        },
      });

      if (errors.length > 0) {
        const validationErrors = this.formatValidationErrors(errors);
        this.logger.warn(
          `Validation failed for ${context}: ${JSON.stringify(validationErrors)}`,
        );

        throw new BadRequestException({
          message: `Validation failed for ${context}`,
          errors: validationErrors,
          context,
        });
      }
    }
  }

  private getDtoClass(data: any): any {
    return null;
  }

  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map((error) => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children
        ? this.formatValidationErrors(error.children)
        : [],
    }));
  }
}
