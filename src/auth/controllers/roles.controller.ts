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
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { RoleType } from '../entities/role.entity';
import { PermissionType } from '../entities/permission.entity';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionDto } from '../dto/assign-permission.dto';

@ApiTags('Roles Management')
@Controller('auth/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_LIST)
  @ApiOperation({ summary: 'List all roles', description: 'Get a list of all roles with pagination (Admin only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiQuery({ name: 'isSystem', description: 'Filter by system roles', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Roles list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRoles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('isSystem') isSystem?: boolean,
  ) {
    return this.rolesService.getRoles(page, limit, isSystem);
  }

  @Get('all')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get all roles without pagination', description: 'Get all roles for dropdowns and forms (Admin only)' })
  @ApiResponse({ status: 200, description: 'All roles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get('all/with-counts')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get all roles with user and permission counts', description: 'Get all roles with detailed counts (Admin only)' })
  @ApiResponse({ status: 200, description: 'All roles with counts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllRolesWithCounts() {
    return this.rolesService.getAllRolesWithCounts();
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get role by ID', description: 'Get complete role information by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ROLE_CREATE)
  @ApiOperation({ summary: 'Create new role', description: 'Create a new role (Super Admin only)' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Role with this name already exists' })
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ROLE_UPDATE)
  @ApiOperation({ summary: 'Update role', description: 'Update role information (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role with this name already exists' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ROLE_DELETE)
  @ApiOperation({ summary: 'Delete role', description: 'Delete a role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role is assigned to users' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Post(':id/permissions')
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ROLE_UPDATE)
  @ApiOperation({ summary: 'Assign permission to role', description: 'Assign a permission to a role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: AssignPermissionDto })
  @ApiResponse({ status: 200, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @ApiResponse({ status: 409, description: 'Permission already assigned' })
  async assignPermission(
    @Param('id') roleId: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(roleId, assignPermissionDto.permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles(RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ROLE_UPDATE)
  @ApiOperation({ summary: 'Remove permission from role', description: 'Remove a permission from a role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  @Get(':id/users')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get users with this role', description: 'Get list of users assigned to a specific role (Admin only)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getUsersWithRole(
    @Param('id') roleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.rolesService.getUsersWithRole(roleId, page, limit);
  }

  @Get('permissions/all')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get all permissions', description: 'Get all available permissions for role assignment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get('permissions/categories')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @Permissions(PermissionType.ROLE_READ)
  @ApiOperation({ summary: 'Get permissions by category', description: 'Get permissions organized by category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions by category retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getPermissionsByCategory() {
    return this.rolesService.getPermissionsByCategory();
  }
}
