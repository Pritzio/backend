import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsObject,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

export class CreateStoreProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Habas Congeladas 500 g',
    minLength: 2,
    maxLength: 500,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced features available at this store',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Product URL in the store',
    example: 'https://store.example.com/iphone15pro',
    required: false,
    maxLength: 500,
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
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({
    description: 'Store-specific product ID',
    example: 'STORE12345',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storeProductId?: string;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://store.example.com/images/iphone15pro.jpg',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  image?: string;

  @ApiProperty({
    description: 'Product price in integer format',
    example: 1299,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Additional metadata',
    example: { storeCategory: 'Electronics', brand: 'Apple' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Special store promotion until end of month',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
