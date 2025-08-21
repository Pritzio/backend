import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, UserType } from '../entities/user.entity';
import { RoleType } from '../entities/role.entity';

// Forward declarations to avoid circular references
export class PermissionResponseDto {
  @ApiProperty({ description: 'Permission unique identifier' })
  id: string;

  @ApiProperty({ description: 'Permission name' })
  name: string;

  @ApiProperty({ description: 'Permission display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  description?: string;

  @ApiProperty({ description: 'Permission category' })
  category: string;

  @ApiProperty({ description: 'Permission priority' })
  priority: number;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'Role unique identifier' })
  id: string;

  @ApiProperty({ description: 'Role name' })
  name: RoleType;

  @ApiProperty({ description: 'Role display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Role description' })
  description?: string;

  @ApiProperty({ description: 'Role priority' })
  priority: number;

  @ApiProperty({ description: 'Role permissions' })
  permissions: PermissionResponseDto[];
}

export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier' })
  id: string;

  @ApiProperty({ description: 'User username' })
  username: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'User full name' })
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiProperty({ description: 'User status' })
  status: UserStatus;

  @ApiProperty({ description: 'User type' })
  type: UserType;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified: boolean;

  @ApiProperty({ description: 'Phone verification status' })
  phoneVerified: boolean;

  @ApiProperty({ description: 'User verification status' })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'User roles' })
  roles: RoleResponseDto[];

  @ApiProperty({ description: 'User permissions' })
  permissions: string[];

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last account update date' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;
}





export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  data?: any;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevPage: boolean;
}
