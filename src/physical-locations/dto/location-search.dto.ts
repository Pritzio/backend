import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max, IsLatitude, IsLongitude } from 'class-validator';

export class LocationSearchDto {
  @ApiProperty({
    description: 'Latitude coordinate for search center',
    example: 40.7128,
    minimum: -90,
    maximum: 90
  })
  @IsNumber()
  @IsLatitude()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate for search center',
    example: -74.0060,
    minimum: -180,
    maximum: 180
  })
  @IsNumber()
  @IsLongitude()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 0.1,
    maximum: 1000,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radius?: number;

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Whether to include only open locations',
    example: true,
    default: false
  })
  @IsOptional()
  includeOpenOnly?: boolean;

  @ApiProperty({
    description: 'Whether to sort by distance',
    example: true,
    default: true
  })
  @IsOptional()
  sortByDistance?: boolean;
}
