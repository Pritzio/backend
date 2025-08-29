import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { StatisticsService, UserStatistics, StoreStatistics, ProductStatistics, SystemStatistics } from '../services/statistics.service';
import { RoleType } from '../../auth/entities/role.entity';
import { PermissionType } from '../../auth/entities/permission.entity';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('users')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Returns comprehensive statistics about users including total, active, inactive, pending verification, suspended, and deleted users'
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of users' },
        active: { type: 'number', description: 'Number of active users' },
        inactive: { type: 'number', description: 'Number of inactive users' },
        pendingVerification: { type: 'number', description: 'Number of users pending email verification' },
        suspended: { type: 'number', description: 'Number of suspended users' },
        deleted: { type: 'number', description: 'Number of soft-deleted users' }
      }
    }
  })
  async getUserStatistics(): Promise<UserStatistics> {
    return this.statisticsService.getUserStatistics();
  }

  @Get('stores')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.STORE_READ, PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get store statistics',
    description: 'Returns comprehensive statistics about stores including total, verified, pending verification, suspended, and deleted stores'
  })
  @ApiResponse({
    status: 200,
    description: 'Store statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of stores' },
        verified: { type: 'number', description: 'Number of verified stores' },
        pendingVerification: { type: 'number', description: 'Number of stores pending verification' },
        suspended: { type: 'number', description: 'Number of suspended stores' },
        deleted: { type: 'number', description: 'Number of soft-deleted stores' }
      }
    }
  })
  async getStoreStatistics(): Promise<StoreStatistics> {
    return this.statisticsService.getStoreStatistics();
  }

  @Get('products')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PRODUCT_READ, PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get product statistics',
    description: 'Returns comprehensive statistics about products including total, active, inactive, and deleted products'
  })
  @ApiResponse({
    status: 200,
    description: 'Product statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of products' },
        active: { type: 'number', description: 'Number of active products' },
        inactive: { type: 'number', description: 'Number of inactive products' },
        deleted: { type: 'number', description: 'Number of soft-deleted products' }
      }
    }
  })
  async getProductStatistics(): Promise<ProductStatistics> {
    return this.statisticsService.getProductStatistics();
  }

  @Get('system')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get complete system statistics',
    description: 'Returns comprehensive statistics for the entire system including users, stores, and products'
  })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' },
            pendingVerification: { type: 'number' },
            suspended: { type: 'number' },
            deleted: { type: 'number' }
          }
        },
        stores: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            verified: { type: 'number' },
            pendingVerification: { type: 'number' },
            suspended: { type: 'number' },
            deleted: { type: 'number' }
          }
        },
        products: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' },
            deleted: { type: 'number' }
          }
        },
        lastUpdated: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getSystemStatistics(): Promise<SystemStatistics> {
    return this.statisticsService.getSystemStatistics();
  }

  @Get('users/by-role')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get user statistics by role',
    description: 'Returns user count grouped by role (customer, admin, super_admin, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics by role retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'number'
      },
      example: {
        customer: 150,
        admin: 5,
        super_admin: 2
      }
    }
  })
  async getUserStatisticsByRole(): Promise<Record<string, number>> {
    return this.statisticsService.getUserStatisticsByRole();
  }

  @Get('stores/by-status')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.STORE_READ, PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get store statistics by verification status',
    description: 'Returns store count grouped by verification status (verified, pending, suspended)'
  })
  @ApiResponse({
    status: 200,
    description: 'Store statistics by status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'number' },
        pending: { type: 'number' },
        suspended: { type: 'number' }
      }
    }
  })
  async getStoreStatisticsByStatus(): Promise<Record<string, number>> {
    return this.statisticsService.getStoreStatisticsByVerificationStatus();
  }

  @Get('products/by-category')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PRODUCT_READ, PermissionType.ANALYTICS_READ)
  @ApiOperation({ 
    summary: 'Get product statistics by category',
    description: 'Returns product count grouped by category'
  })
  @ApiResponse({
    status: 200,
    description: 'Product statistics by category retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'number'
      },
      example: {
        electronics: 50,
        clothing: 30,
        food: 25
      }
    }
  })
  async getProductStatisticsByCategory(): Promise<Record<string, number>> {
    return this.statisticsService.getProductStatisticsByCategory();
  }
}
