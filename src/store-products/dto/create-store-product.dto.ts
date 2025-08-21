import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl, IsNumber, IsArray, IsBoolean, IsObject, MaxLength, MinLength, Min, Max, IsUUID, IsDateString } from 'class-validator';
import { StoreProductStatus, Availability, ScrapingStatus } from '../entities/store-product.entity';

export class CreateStoreProductDto {
  @ApiProperty({
    description: 'Store ID',
    example: 'uuid-store-id'
  })
  @IsUUID()
  storeId: string;

  @ApiProperty({
    description: 'Product ID (master product)',
    example: 'uuid-product-id'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Product name in this store',
    example: 'iPhone 15 Pro - Space Black 256GB',
    minLength: 2,
    maxLength: 500
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced features available at this store',
    required: false,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Product URL in the store',
    example: 'https://store.example.com/iphone15pro',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiProperty({
    description: 'Store-specific SKU',
    example: 'STORE-IP15P-256-SB',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({
    description: 'Store-specific product ID',
    example: 'STORE12345',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storeProductId?: string;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://store.example.com/images/iphone15pro.jpg',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  image?: string;

  @ApiProperty({
    description: 'Online price',
    example: 999.99,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  onlinePrice?: number;

  @ApiProperty({
    description: 'Physical store price',
    example: 989.99,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  physicalPrice?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    description: 'Product availability',
    enum: Availability,
    example: Availability.IN_STOCK,
    default: Availability.IN_STOCK
  })
  @IsEnum(Availability)
  availability: Availability;

  @ApiProperty({
    description: 'Product status',
    enum: StoreProductStatus,
    example: StoreProductStatus.ACTIVE,
    default: StoreProductStatus.ACTIVE
  })
  @IsEnum(StoreProductStatus)
  status: StoreProductStatus;

  @ApiProperty({
    description: 'Scraping status',
    enum: ScrapingStatus,
    example: ScrapingStatus.PENDING,
    default: ScrapingStatus.PENDING
  })
  @IsEnum(ScrapingStatus)
  scrapingStatus: ScrapingStatus;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({
    description: 'Minimum stock level for alerts',
    example: 10,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({
    description: 'Whether product is on sale',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @ApiProperty({
    description: 'Original price before discount',
    example: 1099.99,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({
    description: 'Discount percentage',
    example: 9.09,
    required: false,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
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
    description: 'Product specifications',
    example: { color: 'Space Black', storage: '256GB', ram: '8GB' },
    required: false
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Product features',
    example: ['5G', 'Face ID', 'Pro Camera System'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    description: 'Product tags',
    example: ['smartphone', '5G', 'camera', 'premium'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Additional metadata',
    example: { storeCategory: 'Electronics', brand: 'Apple' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Scraping interval in hours',
    example: 24,
    required: false,
    minimum: 1,
    maximum: 168
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  scrapingIntervalHours?: number;

  @ApiProperty({
    description: 'Scraping configuration',
    example: { selectors: { price: '.price', availability: '.stock' } },
    required: false
  })
  @IsOptional()
  @IsObject()
  scrapingConfig?: Record<string, any>;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Special store promotion until end of month',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
