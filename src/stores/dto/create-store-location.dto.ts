import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsDecimal, MaxLength, Min, Max } from 'class-validator';
import { LocationStatus } from '../entities/physical-location.entity';

export class CreateStoreLocationDto {
  @ApiProperty({
    description: 'Store ID this location belongs to',
    example: 'uuid-store-id'
  })
  @IsString()
  storeId: string;

  @ApiProperty({
    description: 'Store Product ID for product-specific pricing (optional)',
    example: 'uuid-product-id',
    required: false
  })
  @IsOptional()
  @IsString()
  storeProductId?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '10001',
    maxLength: 20
  })
  @IsString()
  @MaxLength(20)
  zipCode: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    minimum: -90,
    maximum: 90
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.0060,
    minimum: -180,
    maximum: 180
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Phone number for this location',
    example: '+1-555-123-4567',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phone?: string;

  @ApiProperty({
    description: 'Business hours for this location',
    example: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hours?: string;

  @ApiProperty({
    description: 'Physical price at this location (optional)',
    example: 299.99,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  physicalPrice?: number;

  @ApiProperty({
    description: 'Currency for pricing',
    example: 'USD',
    default: 'USD',
    maxLength: 10
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    description: 'Location status',
    enum: LocationStatus,
    example: LocationStatus.ACTIVE,
    default: LocationStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiProperty({
    description: 'Additional notes about this location',
    example: 'Located in the shopping mall, second floor',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Additional metadata for this location',
    example: { parking: 'Free parking available', accessibility: 'Wheelchair accessible' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
