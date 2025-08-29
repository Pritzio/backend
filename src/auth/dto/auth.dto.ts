import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType, UserStatus } from '../entities/user.entity';

export class LoginDto {
  @ApiProperty({ description: 'Email or username for login' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  identifier: string; // Can be email or username

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

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

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token for getting new access token' })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address for password reset' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  token: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ description: 'Phone verification code' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  code: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role ID to assign' })
  @IsUUID()
  roleId: string;
}

export class RemoveRoleDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role ID to remove' })
  @IsUUID()
  roleId: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'New user status' })
  @IsEnum(UserStatus)
  status: UserStatus;
}
