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
  ValidateIf,
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
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.website && o.website.trim() !== '')
  @IsString()
  @IsUrl({}, { message: 'website must be a valid URL address' })
  @MaxLength(500)
  website?: string;

  @ApiProperty({
    description: 'Store logo URL',
    example: 'https://electronicsstore.com/logo.png',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @ValidateIf((o) => o.logo && o.logo.trim() !== '')
  @IsString()
  @IsUrl({}, { message: 'logo must be a valid URL address' })
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
  @ValidateIf((o) => o.email && o.email.trim() !== '')
  @IsEmail({}, { message: 'email must be a valid email address' })
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

  @ApiProperty({
    description: 'Store verification status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Store verification date',
    example: '2024-01-16T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  verifiedAt?: Date;

  @ApiProperty({
    description: 'User ID who verified the store',
    example: 'user-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  verifiedBy?: string;
}
