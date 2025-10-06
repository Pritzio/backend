import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

export class BulkCreateProductsOptionsDto {
  @ApiProperty({
    description: 'Skip products with duplicate codes instead of failing',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean = true;

  @ApiProperty({
    description: 'Only validate products without creating them',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean = false;
}

export class BulkCreateProductsDto {
  @ApiProperty({
    description: 'Array of products to create',
    type: [CreateProductDto],
    minItems: 1,
    maxItems: 100,
    example: [
      {
        name: 'iPhone 15 Pro',
        code: 'IPHONE15PRO-256GB',
        category: 'Electronics',
        subcategory: 'Smartphones',
        brand: 'Apple',
        type: 'physical',
        status: 'active',
        condition: 'new',
        description: 'Latest iPhone with advanced features',
        specifications: { color: 'Space Black', storage: '256GB', ram: '8GB' },
        features: ['5G', 'Face ID', 'Pro Camera System'],
        tags: ['smartphone', '5G', 'camera', 'premium'],
      },
      {
        name: 'Samsung Galaxy S24',
        code: 'SAMSUNG-S24-256GB',
        category: 'Electronics',
        subcategory: 'Smartphones',
        brand: 'Samsung',
        type: 'physical',
        status: 'active',
        condition: 'new',
        description: 'Latest Samsung flagship smartphone',
        specifications: {
          color: 'Titanium Gray',
          storage: '256GB',
          ram: '12GB',
        },
        features: ['5G', 'S Pen', 'AI Camera'],
        tags: ['smartphone', '5G', 'android', 'premium'],
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product is required' })
  @ArrayMaxSize(100, {
    message: 'Cannot create more than 100 products at once',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];

  @ApiProperty({
    description: 'Options for bulk creation',
    type: BulkCreateProductsOptionsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BulkCreateProductsOptionsDto)
  options?: BulkCreateProductsOptionsDto;
}

export class BulkCreateProductsResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Bulk operation results',
    type: 'object',
    properties: {
      created: { type: 'number', example: 2 },
      failed: { type: 'number', example: 0 },
      total: { type: 'number', example: 2 },
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: { type: 'object' },
            error: { type: 'string' },
            index: { type: 'number' },
            validated: { type: 'boolean' },
          },
        },
      },
    },
  })
  data: {
    created: number;
    failed: number;
    total: number;
    results: Array<{
      success: boolean;
      product?: any;
      error?: string;
      index: number;
      validated?: boolean;
    }>;
  };

  @ApiProperty({
    description: 'Operation message',
    example: 'Bulk operation completed: 2 created, 0 failed',
  })
  message: string;

  @ApiProperty({
    description: 'Operation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}
