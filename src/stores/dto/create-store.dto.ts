import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsEmail,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  StoreType,
  StoreStatus,
  StoreCategory,
} from '../entities/store.entity';

export class CreateStoreDto {
  @ApiProperty({
    description: 'Store name (must be unique)',
    example: 'Electronics Store',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Store description',
    example: 'Leading electronics retailer with best prices',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Store website URL (must be unique)',
    example: 'https://electronicsstore.com',
    maxLength: 500,
  })
  @IsString()
  @IsUrl()
  @MaxLength(500)
  website: string;

  @ApiProperty({
    description: 'Store logo URL',
    example: 'https://electronicsstore.com/logo.png',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  logo?: string;

  @ApiProperty({
    description: 'Store type',
    enum: StoreType,
    example: StoreType.HYBRID,
    default: StoreType.HYBRID,
  })
  @IsEnum(StoreType)
  type: StoreType;

  @ApiProperty({
    description: 'Store status',
    enum: StoreStatus,
    example: StoreStatus.PENDING_VERIFICATION,
    default: StoreStatus.PENDING_VERIFICATION,
  })
  @IsEnum(StoreStatus)
  status: StoreStatus;

  @ApiProperty({
    description: 'Store category',
    enum: StoreCategory,
    example: StoreCategory.ELECTRONICS,
    default: StoreCategory.OTHER,
  })
  @IsEnum(StoreCategory)
  category: StoreCategory;

  @ApiProperty({
    description: 'Store phone number',
    example: '+1-555-123-4567',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phone?: string;

  @ApiProperty({
    description: 'Store email address',
    example: 'contact@electronicsstore.com',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Store country',
    example: 'United States',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    description: 'Store timezone',
    example: 'America/New_York',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiProperty({
    description: 'Additional metadata for the store',
    example: { socialMedia: { facebook: 'electronicsstore' } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
