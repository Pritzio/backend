import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsNumber, IsBoolean, IsObject, MaxLength, MinLength, Min, Max } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique category slug',
    example: 'electronics',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Electronic devices and gadgets',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Category image URL',
    example: 'https://example.com/electronics.jpg',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  image?: string;

  @ApiProperty({
    description: 'Category icon',
    example: 'fas fa-mobile-alt',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({
    description: 'Category color (hex)',
    example: '#007AFF',
    required: false,
    maxLength: 7
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

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
    description: 'Whether category is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether category is featured',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Whether category is system-managed',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: 'Parent category ID',
    example: 'uuid-parent-category',
    required: false
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { seoTitle: 'Best Electronics', seoDescription: 'Find the latest electronics' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
