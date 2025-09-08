import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScrapingService } from '../services/scraping.service';
import { ScrapeUrlDto, ScrapingResponseDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';

@ApiTags('Scraping')
@Controller('scraping')
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('scrape-fast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Fast HTML capture - optimized for dynamic content',
    description:
      'Captures HTML content with JavaScript enabled for dynamic content loading. Blocks only images and media for speed while allowing CSS, fonts, and API calls. Perfect for pages that load products via API.',
  })
  @ApiQuery({
    name: 'url',
    description: 'URL to capture (any valid HTTP/HTTPS URL)',
    example: 'https://www.example.com/page',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'timeout',
    description: 'Timeout in milliseconds (5000-15000). Only used when waitForSelector is not provided.',
    example: 8000,
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'waitForSelector',
    description: 'CSS selector to wait for before scraping. If provided, timeout is ignored and uses 5s fixed timeout.',
    example: '[data-cnstrc-item-id]',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'HTML content scraped successfully (fast mode)',
    type: ScrapingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid URL format or parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Scraping failed',
  })
  async scrapeUrlFast(@Query() query: ScrapeUrlDto): Promise<ScrapingResponseDto> {
    try {
      if (!query.url) {
        throw new HttpException(
          'URL parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Perform fast scraping
      const result = await this.scrapingService.getHtmlFast(query);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Scraping failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Fast scraping error for ${query.url}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        'An unexpected error occurred during scraping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scrape')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Capture HTML content from any web page (full mode)',
    description:
      'Simulates a browser visit to any URL and returns the raw HTML content for external processing. Waits for all resources to load.',
  })
  @ApiQuery({
    name: 'url',
    description: 'URL to capture (any valid HTTP/HTTPS URL)',
    example: 'https://www.example.com/page',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'timeout',
    description:
      'Timeout in milliseconds for waiting for content (5000-120000)',
    example: 30000,
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'waitForSelector',
    description: 'CSS selector to wait for before scraping',
    example: '[data-cnstrc-item-id]',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'userAgent',
    description: 'Custom user agent string',
    example:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'HTML content scraped successfully',
    type: ScrapingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid URL format or parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Scraping failed',
  })
  async scrapeUrl(@Query() query: ScrapeUrlDto): Promise<ScrapingResponseDto> {
    try {
      if (!query.url) {
        throw new HttpException(
          'URL parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Perform scraping
      const result = await this.scrapingService.getHtml(query);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Scraping failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Scraping error for ${query.url}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        'An unexpected error occurred during scraping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Check scraping service health',
    description:
      'Verifies that the scraping service is working correctly by testing browser launch capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'scraping' },
        timestamp: { type: 'string', example: '2025-01-21T10:30:00.000Z' },
        browser: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  async healthCheck() {
    try {
      const browserHealthy = await this.scrapingService.healthCheck();

      if (!browserHealthy) {
        throw new HttpException(
          'Scraping service is unhealthy',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: 'ok',
        service: 'scraping',
        timestamp: new Date().toISOString(),
        browser: true,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new HttpException(
        'Scraping service is unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('info')
  @ApiOperation({
    summary: 'Get scraping service information',
    description:
      'Returns information about the scraping service configuration and capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'scraping' },
        version: { type: 'string', example: '1.0.0' },
        capabilities: {
          type: 'object',
          properties: {
            browser: { type: 'string', example: 'chromium' },
            headless: { type: 'boolean', example: true },
            supportedDomains: {
              type: 'array',
              items: { type: 'string' },
              example: ['jumbo.cl'],
            },
            defaultTimeout: { type: 'number', example: 30000 },
            defaultSelector: {
              type: 'string',
              example: '[data-cnstrc-item-id]',
            },
          },
        },
        timestamp: { type: 'string', example: '2025-01-21T10:30:00.000Z' },
      },
    },
  })
  getServiceInfo() {
    return {
      service: 'scraping',
      version: '1.0.0',
      capabilities: {
        browser: 'chromium',
        headless: true,
        supportedDomains: ['jumbo.cl'],
        defaultTimeout: 30000,
        defaultSelector: '[data-cnstrc-item-id]',
        features: [
          'JavaScript rendering',
          'Dynamic content waiting',
          'Metadata extraction',
          'Anti-detection measures',
          'Configurable timeouts',
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
