import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { PermissionType } from '../../auth/entities/permission.entity';
import { UsersService } from '../services/users.service';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { CreateUserPreferencesDto } from '../dto/create-user-preferences.dto';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { SoftDeleteUserDto } from '../dto/soft-delete-user.dto';
import { UserProfile } from '../entities/user-profile.entity';
import { UserPreferences } from '../entities/user-preferences.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { IUserProfileResponse, IUserProfileSummary } from '../interfaces/user-profile.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_CREATE)
  @ApiOperation({ summary: 'Create user profile', description: 'Create a new user profile for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Profile created successfully', type: UserProfile })
  @ApiResponse({ status: 400, description: 'Profile already exists or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createProfile(
    @Body() createUserProfileDto: CreateUserProfileDto,
    @CurrentUser() user: any,
  ): Promise<UserProfile> {
    return this.usersService.createUserProfile(user.id, createUserProfileDto);
  }

  @Get('profile')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get own profile', description: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: UserProfile })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getOwnProfile(@CurrentUser() user: any): Promise<IUserProfileResponse> {
    return this.usersService.getUserProfile(user.id, user.id);
  }

  @Get('profile/:userId')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get user profile by ID', description: 'Get a user profile by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID to get profile for' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: UserProfile })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or profile is private' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getUserProfile(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<IUserProfileResponse> {
    return this.usersService.getUserProfile(userId, user.id);
  }

  @Put('profile')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @ApiOperation({ summary: 'Update own profile', description: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserProfile })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateOwnProfile(
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @CurrentUser() user: any,
  ): Promise<UserProfile> {
    return this.usersService.updateUserProfile(user.id, updateUserProfileDto);
  }

  @Put('profile/:userId')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @ApiOperation({ summary: 'Update user profile by ID', description: 'Update a user profile by user ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to update profile for' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserProfile })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    return this.usersService.updateUserProfile(userId, updateUserProfileDto);
  }

  @Delete('profile')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_DELETE)
  @ApiOperation({ summary: 'Delete own profile', description: 'Delete the authenticated user profile' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOwnProfile(@CurrentUser() user: any): Promise<void> {
    return this.usersService.deleteUserProfile(user.id);
  }

  @Post('preferences')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_CREATE)
  @ApiOperation({ summary: 'Create user preferences', description: 'Create user preferences for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Preferences created successfully', type: UserPreferences })
  @ApiResponse({ status: 400, description: 'Preferences already exist or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createPreferences(
    @Body() createUserPreferencesDto: CreateUserPreferencesDto,
    @CurrentUser() user: any,
  ): Promise<UserPreferences> {
    return this.usersService.createUserPreferences(user.id, createUserPreferencesDto);
  }

  @Get('preferences')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get own preferences', description: 'Get the authenticated user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully', type: UserPreferences })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  async getOwnPreferences(@CurrentUser() user: any): Promise<UserPreferences> {
    return this.usersService.getUserPreferences(user.id);
  }

  @Put('preferences')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @ApiOperation({ summary: 'Update own preferences', description: 'Update the authenticated user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully', type: UserPreferences })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  async updateOwnPreferences(
    @Body() updateUserPreferencesDto: UpdateUserPreferencesDto,
    @CurrentUser() user: any,
  ): Promise<UserPreferences> {
    return this.usersService.updateUserPreferences(user.id, updateUserPreferencesDto);
  }

  @Get('search')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Search users', description: 'Search for users by name or bio' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results', type: [UserProfile] })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: any,
  ): Promise<IUserProfileSummary[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }
    return this.usersService.searchUsers(query.trim(), user.id, limit);
  }

  @Get('activity')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get own activity', description: 'Get the authenticated user activity log' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of activities', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Activity log retrieved successfully', type: [UserActivity] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getOwnActivity(
    @Query('limit') limit: number = 50,
    @CurrentUser() user: any,
  ): Promise<UserActivity[]> {
    return this.usersService.getUserActivity(user.id, limit);
  }

  @Get('stats')
  @Roles(RoleType.CUSTOMER, RoleType.STORE_EMPLOYEE, RoleType.STORE_MANAGER, RoleType.STORE_ADMIN, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get profile stats', description: 'Get profile completeness and activity statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getProfileStats(@CurrentUser() user: any) {
    return this.usersService.getProfileStats(user.id);
  }

  // ===== ADMINISTRATIVE ENDPOINTS =====

  @Get('admin/users')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_LIST)
  @ApiOperation({ summary: 'List all users (Admin only)', description: 'Get a list of all users with pagination (Admin only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiQuery({ name: 'status', description: 'Filter by user status', required: false })
  @ApiQuery({ name: 'role', description: 'Filter by user role', required: false })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.getAllUsers(page, limit, status, role);
  }

  @Get('admin/users/:userId')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_READ)
  @ApiOperation({ summary: 'Get user by ID (Admin only)', description: 'Get complete user information by ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to get information for' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getAdminUserInfo(@Param('userId') userId: string) {
    return this.usersService.getAdminUserInfo(userId);
  }

  @Put('admin/users/:userId/status')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @ApiOperation({ summary: 'Update user status (Admin only)', description: 'Update user status (active, suspended, etc.) (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to update status for' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.usersService.updateUserStatus(userId, body.status, body.reason);
  }

  @Delete('admin/users/:userId')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_DELETE)
  @ApiOperation({ summary: 'Soft delete user (Admin/Super Admin)', description: 'Soft delete a user account (Admin can delete regular users, Super Admin can delete anyone)' })
  @ApiParam({ name: 'userId', description: 'User ID to delete' })
  @ApiBody({ type: SoftDeleteUserDto })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('userId') userId: string,
    @Body() softDeleteDto: SoftDeleteUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.deleteUser(userId, currentUser, softDeleteDto);
  }

  @Post('admin/users/:userId/restore')
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.USER_UPDATE)
  @ApiOperation({ summary: 'Restore deleted user (Super Admin only)', description: 'Restore a soft deleted user account (Super Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to restore' })
  @ApiQuery({ name: 'reason', description: 'Reason for restoration', required: false })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 400, description: 'User is not deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: any,
    @Query('reason') reason?: string,
  ) {
    return this.usersService.restoreUser(userId, currentUser, reason);
  }

  @Get('admin/analytics')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get user analytics (Admin only)', description: 'Get analytics and statistics about users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUserAnalytics() {
    return this.usersService.getUserAnalytics();
  }
}
