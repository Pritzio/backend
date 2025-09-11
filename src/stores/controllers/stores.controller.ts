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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { StoresService } from '../services/stores.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { CreateStoreLocationDto } from '../dto/create-store-location.dto';
import { UpdateStoreLocationDto } from '../dto/update-store-location.dto';
import {
  Store,
  StoreType,
  StoreStatus,
  StoreCategory,
} from '../entities/store.entity';
import { PhysicalLocation } from '../../physical-locations/entities/physical-location.entity';
import {
  IStoreResponse,
  IStoreListResponse,
  IStoreAnalytics,
} from '../interfaces/store.interface';
import { RoleType } from '../../auth/entities/role.entity';

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ===== STORE MANAGEMENT ENDPOINTS =====

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new store',
    description:
      'Create a new store. Only SUPER_ADMIN and ADMIN can create stores.',
  })
  @ApiBody({ type: CreateStoreDto })
  @ApiCreatedResponse({
    description: 'Store created successfully',
    type: Store,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - validation error or store already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to create stores',
  })
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Request() req: any,
  ): Promise<Store> {
    return this.storesService.createStore(createStoreDto, req.user);
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get all stores for management',
    description:
      'Retrieve all stores for administrative purposes. Only SUPER_ADMIN and ADMIN can access.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StoreStatus,
    description: 'Filter by store status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: StoreType,
    description: 'Filter by store type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: StoreCategory,
    description: 'Filter by store category',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
  })
  @ApiOkResponse({
    description: 'Admin stores list retrieved successfully',
    type: Object, // IStoreListResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions for admin access',
  })
  async getAdminStores(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('status') status?: StoreStatus,
    @Query('type') type?: StoreType,
    @Query('category') category?: StoreCategory,
    @Query('isVerified') isVerified?: boolean,
  ): Promise<IStoreListResponse> {
    const filters = {
      status,
      type,
      category,
      isVerified,
    };

    return this.storesService.getAllStores(page, limit, filters, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all stores with pagination and filters',
    description:
      'Retrieve a paginated list of stores with optional filtering. Access depends on user role.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: StoreType,
    description: 'Filter by store type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StoreStatus,
    description: 'Filter by store status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: StoreCategory,
    description: 'Filter by store category',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    type: String,
    description: 'Filter by country',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'hasPhysicalLocations',
    required: false,
    type: Boolean,
    description: 'Filter by physical locations',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, description, or website',
  })
  @ApiQuery({
    name: 'createdAfter',
    required: false,
    type: Date,
    description: 'Filter by creation date (after)',
  })
  @ApiQuery({
    name: 'createdBefore',
    required: false,
    type: Date,
    description: 'Filter by creation date (before)',
  })
  @ApiOkResponse({
    description: 'Stores retrieved successfully',
    type: Object, // IStoreListResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getAllStores(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: StoreType,
    @Query('status') status?: StoreStatus,
    @Query('category') category?: StoreCategory,
    @Query('country') country?: string,
    @Query('isVerified') isVerified?: boolean,
    @Query('hasPhysicalLocations') hasPhysicalLocations?: boolean,
    @Query('search') search?: string,
    @Query('createdAfter') createdAfter?: Date,
    @Query('createdBefore') createdBefore?: Date,
  ): Promise<IStoreListResponse> {
    const filters = {
      type,
      status,
      category,
      country,
      isVerified,
      hasPhysicalLocations,
      search,
      createdAfter,
      createdBefore,
    };

    return this.storesService.getAllStores(page, limit, filters, req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get store by ID',
    description:
      'Retrieve a specific store by its ID. Access depends on user role.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store retrieved successfully',
    type: Object, // IStoreResponse
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to view this store',
  })
  async getStoreById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IStoreResponse> {
    // Pass roles as separate parameter to avoid serialization issues
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    return this.storesService.getStoreById(id, userId, userRoles);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Update store by ID',
    description:
      'Update a specific store by its ID. SUPER_ADMIN and ADMIN can update any store, STORE_ADMIN can only update their own stores.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiBody({ type: UpdateStoreDto })
  @ApiOkResponse({
    description: 'Store updated successfully',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - validation error or store already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to update this store',
  })
  async updateStore(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Request() req: any,
  ): Promise<Store> {
    // Pass roles as separate parameter to avoid serialization issues
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    return this.storesService.updateStore(id, updateStoreDto, userId, userRoles);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete store by ID',
    description:
      'Delete a specific store by its ID. Only SUPER_ADMIN can delete stores.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Store deleted successfully' },
        storeId: { type: 'string', example: 'uuid-store-id' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - store has associated data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to delete stores',
  })
  async deleteStore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string; storeId: string }> {
    return this.storesService.deleteStore(id, req.user);
  }

  // ===== PHYSICAL LOCATION MANAGEMENT ENDPOINTS =====

  @Post(':storeId/locations')
  @ApiOperation({
    summary: 'Add physical location to store',
    description:
      'Add a new physical location to a specific store. Access depends on user role.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID (UUID)' })
  @ApiBody({ type: CreateStoreLocationDto })
  @ApiCreatedResponse({
    description: 'Physical location created successfully',
    type: PhysicalLocation,
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - validation error',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - insufficient permissions to manage store locations',
  })
  async createPhysicalLocation(
    @Param('storeId') storeId: string,
    @Body() createLocationDto: CreateStoreLocationDto,
    @Request() req: any,
  ): Promise<PhysicalLocation> {
    // Ensure the storeId in the DTO matches the path parameter
    createLocationDto.storeId = storeId;
    return this.storesService.createPhysicalLocation(
      createLocationDto,
      req.user,
    );
  }

  @Put('locations/:locationId')
  @ApiOperation({
    summary: 'Update physical location',
    description:
      'Update a specific physical location. Access depends on user role.',
  })
  @ApiParam({ name: 'locationId', description: 'Physical Location ID (UUID)' })
  @ApiBody({ type: UpdateStoreLocationDto })
  @ApiOkResponse({
    description: 'Physical location updated successfully',
    type: PhysicalLocation,
  })
  @ApiNotFoundResponse({
    description: 'Physical location not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - validation error',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to manage this location',
  })
  async updatePhysicalLocation(
    @Param('locationId') locationId: string,
    @Body() updateLocationDto: UpdateStoreLocationDto,
    @Request() req: any,
  ): Promise<PhysicalLocation> {
    return this.storesService.updatePhysicalLocation(
      locationId,
      updateLocationDto,
      req.user,
    );
  }

  @Delete('locations/:locationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete physical location',
    description:
      'Delete a specific physical location. Access depends on user role.',
  })
  @ApiParam({ name: 'locationId', description: 'Physical Location ID (UUID)' })
  @ApiOkResponse({
    description: 'Physical location deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Physical location deleted successfully',
        },
        locationId: { type: 'string', example: 'uuid-location-id' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Physical location not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions to delete this location',
  })
  async deletePhysicalLocation(
    @Param('locationId') locationId: string,
    @Request() req: any,
  ): Promise<{ message: string; locationId: string }> {
    return this.storesService.deletePhysicalLocation(locationId, req.user);
  }

  // ===== ANALYTICS ENDPOINTS =====

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get store analytics',
    description:
      'Retrieve comprehensive analytics for a specific store. Access depends on user role.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store analytics retrieved successfully',
    type: Object, // IStoreAnalytics
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - insufficient permissions to view this store analytics',
  })
  async getStoreAnalytics(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IStoreAnalytics> {
    return this.storesService.getStoreAnalytics(id, req.user);
  }

  // ===== ADMIN ENDPOINTS =====

  @Put('admin/:id/verify')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Admin: Verify store',
    description:
      'Mark a store as verified. Only SUPER_ADMIN and ADMIN can verify stores.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store verified successfully',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions for admin access',
  })
  async verifyStore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Store> {
    // Pass roles as separate parameter to avoid serialization issues
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    return this.storesService.verifyStore(id, userId, userRoles);
  }

  @Put('admin/:id/suspend')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Admin: Suspend store',
    description:
      'Suspend a store. Only SUPER_ADMIN and ADMIN can suspend stores.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store suspended successfully',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions for admin access',
  })
  async suspendStore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Store> {
    // Pass roles as separate parameter to avoid serialization issues
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    return this.storesService.suspendStore(id, userId, userRoles);
  }

  @Put('admin/:id/reactivate')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Admin: Reactivate store',
    description:
      'Reactivate a suspended store. Only SUPER_ADMIN and ADMIN can reactivate stores.',
  })
  @ApiParam({ name: 'id', description: 'Store ID (UUID)' })
  @ApiOkResponse({
    description: 'Store reactivated successfully',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions for admin access',
  })
  async reactivateStore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Store> {
    // Pass roles as separate parameter to avoid serialization issues
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    return this.storesService.reactivateStore(id, userId, userRoles);
  }
}
