import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsNumber,
  IsArray,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import {
  ProductStatus,
  ProductType,
  ProductCondition,
} from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    minLength: 2,
    maxLength: 500,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced features',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Unique product code',
    example: 'IPHONE15PRO-256GB',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: 'Stock Keeping Unit',
    example: 'IP15P-256-SL',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({
    description: 'Product barcode',
    example: '1234567890123',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/iphone15pro.jpg',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  image?: string;

  @ApiProperty({
    description: 'Product brand',
    example: 'Apple',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({
    description: 'Product subcategory',
    example: 'Smartphones',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ApiProperty({
    description: 'Product type',
    enum: ProductType,
    example: ProductType.PHYSICAL,
    default: ProductType.PHYSICAL,
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
    default: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty({
    description: 'Product condition',
    enum: ProductCondition,
    example: ProductCondition.NEW,
    default: ProductCondition.NEW,
  })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiProperty({
    description: 'Product model',
    example: 'A3102',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({
    description: 'Product manufacturer',
    example: 'Apple Inc.',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiProperty({
    description: 'Product country of origin',
    example: 'United States',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    description: 'Product weight in grams',
    example: 187.0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'Weight unit',
    example: 'g',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  weightUnit?: string;

  @ApiProperty({
    description: 'Product length in cm',
    example: 14.7,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiProperty({
    description: 'Product width in cm',
    example: 7.1,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiProperty({
    description: 'Product height in cm',
    example: 0.8,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiProperty({
    description: 'Dimension unit',
    example: 'cm',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dimensionUnit?: string;

  @ApiProperty({
    description: 'Warranty in months',
    example: 12,
    required: false,
    minimum: 0,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  warrantyMonths?: number;

  @ApiProperty({
    description: 'Product specifications',
    example: { color: 'Space Black', storage: '256GB', ram: '8GB' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Product features',
    example: ['5G', 'Face ID', 'Pro Camera System'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    description: 'Product tags',
    example: ['smartphone', '5G', 'camera', 'premium'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Additional metadata',
    example: { color: 'Space Black', storage: '256GB' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
