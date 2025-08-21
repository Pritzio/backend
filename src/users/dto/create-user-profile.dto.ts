import { IsOptional, IsString, IsDate, IsEnum, IsBoolean, IsUrl, Length, IsDateString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, ProfileVisibility } from '../entities/user-profile.entity';
import { IsAdult, IsNotFutureDate, IsValidPhoneNumber, IsValidWebsite } from '../validators/business-rules.validator';

export class CreateUserProfileDto {
  @ApiPropertyOptional({ description: 'User first name', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'First name can only contain letters, spaces, hyphens, and apostrophes' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'User date of birth (must be at least 13 years old)' })
  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  @IsAdult()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'User gender', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'User phone number (international format)', minLength: 10, maxLength: 20 })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  @IsValidPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'User address', maxLength: 200 })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  address?: string;

  @ApiPropertyOptional({ description: 'User city', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'User state/province', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  state?: string;

  @ApiPropertyOptional({ description: 'User zip/postal code', maxLength: 10 })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  @Matches(/^[a-zA-Z0-9\s-]+$/, { message: 'Zip code can only contain letters, numbers, spaces, and hyphens' })
  zipCode?: string;

  @ApiPropertyOptional({ description: 'User country', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'User website URL', maxLength: 200 })
  @IsOptional()
  @IsValidWebsite()
  @Length(0, 200)
  website?: string;

  @ApiPropertyOptional({ description: 'User bio', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  @Matches(/^[^<>]*$/, { message: 'Bio cannot contain HTML tags' })
  bio?: string;

  @ApiPropertyOptional({ description: 'User avatar URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @Length(0, 200)
  avatar?: string;

  @ApiPropertyOptional({ description: 'User cover photo URL', maxLength: 200 })
  @IsOptional()
  @IsUrl()
  @Length(0, 200)
  coverPhoto?: string;

  @ApiPropertyOptional({ description: 'Profile visibility', enum: ProfileVisibility, default: ProfileVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @ApiPropertyOptional({ description: 'Whether user is verified', default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
