import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsNumber, IsBoolean, IsObject, IsArray, MaxLength, MinLength, Min, Max } from 'class-validator';

export class CreateProductBrandDto {
  @ApiProperty({
    description: 'Brand name',
    example: 'Apple',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique brand slug',
    example: 'apple',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiProperty({
    description: 'Brand description',
    example: 'Think Different. Apple Inc.',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Brand logo URL',
    example: 'https://example.com/apple-logo.png',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  logo?: string;

  @ApiProperty({
    description: 'Brand website',
    example: 'https://www.apple.com',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiProperty({
    description: 'Brand country of origin',
    example: 'United States',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    description: 'Year brand was founded',
    example: '1976',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  founded?: string;

  @ApiProperty({
    description: 'Brand story/history',
    example: 'Apple Inc. was founded by Steve Jobs and Steve Wozniak...',
    required: false,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  story?: string;

  @ApiProperty({
    description: 'Brand headquarters location',
    example: 'Cupertino, California',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  headquarters?: string;

  @ApiProperty({
    description: 'Brand CEO',
    example: 'Tim Cook',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ceo?: string;

  @ApiProperty({
    description: 'Number of employees',
    example: 154000,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  employeeCount?: number;

  @ApiProperty({
    description: 'Annual revenue',
    example: 394328000000,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualRevenue?: number;

  @ApiProperty({
    description: 'Currency for revenue',
    example: 'USD',
    required: false,
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    description: 'Social media accounts',
    example: { twitter: '@Apple', instagram: 'apple', facebook: 'Apple' },
    required: false
  })
  @IsOptional()
  @IsObject()
  socialMedia?: Record<string, string>;

  @ApiProperty({
    description: 'Brand certifications',
    example: ['ISO 9001', 'ISO 14001', 'Fair Trade'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({
    description: 'Whether brand is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether brand is verified',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Whether brand is premium',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
    required: false,
    minimum: 0,
    maximum: 999
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  sortOrder?: number;

  @ApiProperty({
    description: 'Additional metadata',
    example: { seoTitle: 'Apple Products', seoDescription: 'Official Apple products and accessories' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
