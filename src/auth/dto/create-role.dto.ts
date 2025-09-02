import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsUUID,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../entities/role.entity';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name (must be unique)', enum: RoleType })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({
    description: 'Display name for the role',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  displayName: string;

  @ApiPropertyOptional({ description: 'Role description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a system role',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: 'Role priority (higher number = higher priority)',
    minimum: 0,
    maximum: 1000,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Array of permission IDs to assign to this role',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}
