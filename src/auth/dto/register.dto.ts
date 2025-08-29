import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ description: 'Unique username' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'User type' })
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @ApiProperty({ 
    description: 'Acceptance of terms and conditions',
    example: true,
    required: true
  })
  @IsBoolean({ message: 'Terms and conditions acceptance is required' })
  acceptTermsAndConditions: boolean;
}
