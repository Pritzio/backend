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
  IsUUID,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import {
  LocationStatus,
  LocationType,
} from '../entities/physical-location.entity';

export class CreatePhysicalLocationDto {
  @ApiProperty({
    description: 'Store ID',
    example: 'uuid-store-id',
  })
  @IsUUID()
  storeId: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Store',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Location description',
    example: 'Main store location in downtown area',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Location type',
    enum: LocationType,
    example: LocationType.STORE,
    default: LocationType.STORE,
  })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiProperty({
    description: 'Location status',
    enum: LocationStatus,
    example: LocationStatus.ACTIVE,
    default: LocationStatus.ACTIVE,
  })
  @IsEnum(LocationStatus)
  status: LocationStatus;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: 'Additional address line',
    example: 'Suite 100',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address2?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'NY',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '10001',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsLatitude()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsLongitude()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Phone number',
    example: '+1-555-123-4567',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'downtown@store.com',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://store.com/downtown',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiProperty({
    description: 'Business hours configuration',
    example: { monday: { open: '09:00', close: '18:00', isOpen: true } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  businessHours?: Record<
    string,
    {
      open: string;
      close: string;
      isOpen: boolean;
      specialHours?: string;
    }
  >;

  @ApiProperty({
    description: 'Whether location is open 24 hours',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOpen24Hours?: boolean;

  @ApiProperty({
    description: 'Whether location has parking',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasParking?: boolean;

  @ApiProperty({
    description: 'Whether location has wheelchair access',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasWheelchairAccess?: boolean;

  @ApiProperty({
    description: 'Whether location has public transport access',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasPublicTransport?: boolean;

  @ApiProperty({
    description: 'Available amenities',
    example: ['WiFi', 'Restroom', 'ATM'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    description: 'Available services',
    example: ['Pickup', 'Delivery', 'Returns'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({
    description: 'Physical location price (overrides store price)',
    example: 999.99,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  physicalPrice?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    description: 'Price adjustments for this location',
    example: {
      rush_hour: {
        reason: 'Rush hour surcharge',
        adjustment: 5,
        percentage: true,
        validFrom: '2024-01-01',
      },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  priceAdjustments?: Record<
    string,
    {
      reason: string;
      adjustment: number;
      percentage: boolean;
      validFrom: Date;
      validTo?: Date;
    }
  >;

  @ApiProperty({
    description: 'Maximum capacity',
    example: 100,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @ApiProperty({
    description: 'Current capacity',
    example: 50,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentCapacity?: number;

  @ApiProperty({
    description: 'Operating hours for each day',
    example: { monday: { open: '09:00', close: '18:00', isOpen: true } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  operatingHours?: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };

  @ApiProperty({
    description: 'Special operating hours',
    example: [
      {
        date: '2024-12-25',
        open: '10:00',
        close: '16:00',
        isOpen: true,
        reason: 'Christmas Day',
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  specialHours?: Array<{
    date: string;
    open: string;
    close: string;
    isOpen: boolean;
    reason: string;
  }>;

  @ApiProperty({
    description: 'Holiday schedules',
    example: [{ date: '2024-12-25', name: 'Christmas Day', isOpen: false }],
    required: false,
  })
  @IsOptional()
  @IsArray()
  holidays?: Array<{
    date: string;
    name: string;
    isOpen: boolean;
    openHours?: string;
    closeHours?: string;
  }>;

  @ApiProperty({
    description: 'Additional metadata',
    example: { timezone: 'America/New_York', taxRate: 0.0875 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
