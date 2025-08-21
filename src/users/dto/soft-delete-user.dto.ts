import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class SoftDeleteUserDto {
  @ApiProperty({
    description: 'Reason for soft deletion',
    example: 'User requested account deletion',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    description: 'Additional notes about the deletion',
    example: 'User was inactive for 6 months',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
