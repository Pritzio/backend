import { IsUrl, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScrapeUrlDto {
  @ApiProperty({
    description: 'URL to scrape',
    example: 'https://jumbo.cl/marcas-exclusivas',
    type: String,
  })
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @ApiPropertyOptional({
    description: 'Timeout in milliseconds for waiting for content to load',
    example: 30000,
    default: 30000,
    minimum: 5000,
    maximum: 120000,
  })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(120000)
  timeout?: number;

  @ApiPropertyOptional({
    description: 'CSS selector to wait for before scraping',
    example: '[data-cnstrc-item-id]',
    default: '[data-cnstrc-item-id]',
  })
  @IsOptional()
  @IsString()
  waitForSelector?: string;

  @ApiPropertyOptional({
    description: 'Custom user agent string',
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ScrapingResponseDto {
  @ApiProperty({
    description: 'Whether the scraping was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'HTML content of the scraped page',
    example: '<html><body>...</body></html>',
  })
  html?: string;

  @ApiProperty({
    description: 'URL that was scraped',
    example: 'https://jumbo.cl/marcas-exclusivas',
  })
  url: string;

  @ApiProperty({
    description: 'Timestamp when scraping was performed',
    example: '2025-01-21T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Execution time in milliseconds',
    example: 2500,
  })
  executionTime: number;

  @ApiPropertyOptional({
    description: 'Error message if scraping failed',
    example: 'Timeout waiting for content to load',
  })
  error?: string;
}
