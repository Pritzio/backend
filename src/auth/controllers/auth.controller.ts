import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
  UpdateProfileDto,
  AssignRoleDto,
  RemoveRoleDto,
  UpdateUserStatusDto,
  CreateSuperAdminDto,
} from '../dto/auth.dto';
import { RegisterDto } from '../dto/register.dto';

import {
  AuthResponseDto,
  UserResponseDto,
  MessageResponseDto,
} from '../dto/auth-response.dto';
import { RoleType } from '../entities/role.entity';
import { PermissionType } from '../entities/permission.entity';
import {
  BasicSecurity,
  StrictSecurity,
  ApiKeyProtected,
  AdminOnly,
  ValidatePayload,
  SecurityLogging,
} from '../../common/security/decorators/security.decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async test(): Promise<{ message: string; hash?: string }> {
    try {
      const bcrypt = require('bcrypt');
      const password = 'TestPass123!';
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      return { message: 'Auth module is working with hash!', hash };
    } catch (error) {
      return {
        message: `Auth module is working but hash failed: ${error.message}`,
      };
    }
  }

  @Post('register')
  @BasicSecurity()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email or username already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @StrictSecurity()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account not active',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    type: MessageResponseDto,
  })
  async logout(@CurrentUser() user: any): Promise<MessageResponseDto> {
    return this.authService.logout(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if user exists)',
    type: MessageResponseDto,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<MessageResponseDto> {
    // TODO: Implement email verification
    return { message: 'Email verification endpoint - implementation pending' };
  }

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone number' })
  @ApiResponse({
    status: 200,
    description: 'Phone successfully verified',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code',
  })
  async verifyPhone(
    @Body() verifyPhoneDto: VerifyPhoneDto,
  ): Promise<MessageResponseDto> {
    // TODO: Implement phone verification
    return { message: 'Phone verification endpoint - implementation pending' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    // TODO: Implement get profile method in auth service
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile successfully updated',
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post('assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_ASSIGN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Role successfully assigned',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
  ): Promise<MessageResponseDto> {
    return this.authService.assignRole(assignRoleDto);
  }

  @Delete('remove-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_ASSIGN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Role successfully removed',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async removeRole(
    @Body() removeRoleDto: RemoveRoleDto,
  ): Promise<MessageResponseDto> {
    return this.authService.removeRole(removeRoleDto);
  }

  @Put('user-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User status successfully updated',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async updateUserStatus(
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<MessageResponseDto> {
    return this.authService.updateUserStatus(updateUserStatusDto);
  }

  @Post('run-seeder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Run Authentication Seeder (No authentication required)',
    description: 'Creates all roles and permissions in the system. Safe to run multiple times.'
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication seeder completed successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to run authentication seeder',
  })
  async runAuthSeeder(): Promise<MessageResponseDto> {
    return this.authService.runAuthSeeder();
  }

  @Post('create-super-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create Super Admin (No authentication required)',
    description: 'Creates the first Super Admin user. Only works if no SUPER_ADMIN exists in the system.'
  })
  @ApiResponse({
    status: 201,
    description: 'Super Admin successfully created',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Super Admin already exists or user with email/username already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or SUPER_ADMIN role not found',
  })
  async createSuperAdmin(
    @Body() createSuperAdminDto: CreateSuperAdminDto,
  ): Promise<AuthResponseDto> {
    return this.authService.createSuperAdmin(createSuperAdminDto);
  }
}
