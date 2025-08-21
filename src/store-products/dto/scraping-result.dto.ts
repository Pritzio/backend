import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Availability, ScrapingStatus } from '../entities/store-product.entity';

export class ScrapingResultDto {
  @ApiProperty({
    description: 'Store product ID',
    example: 'uuid-store-product-id'
  })
  @IsString()
  storeProductId: string;

  @ApiProperty({
    description: 'Scraping status',
    enum: ScrapingStatus,
    example: ScrapingStatus.COMPLETED
  })
  @IsEnum(ScrapingStatus)
  status: ScrapingStatus;

  @ApiProperty({
    description: 'Online price found',
    example: 999.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  onlinePrice?: number;

  @ApiProperty({
    description: 'Physical store price found',
    example: 989.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  physicalPrice?: number;

  @ApiProperty({
    description: 'Product availability',
    enum: Availability,
    example: Availability.IN_STOCK,
    required: false
  })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiProperty({
    description: 'Stock quantity found',
    example: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiProperty({
    description: 'Whether product is on sale',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ApiProperty({
    description: 'Original price before discount',
    example: 1099.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiProperty({
    description: 'Discount percentage',
    example: 9.09,
    required: false
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiProperty({
    description: 'Sale end date',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiProperty({
    description: 'Error message if scraping failed',
    example: 'Element not found: .price-selector',
    required: false
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 1250,
    required: false
  })
  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @ApiProperty({
    description: 'Additional metadata from scraping',
    example: { imageUrl: 'https://example.com/image.jpg', description: 'Updated description' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
