import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PhysicalLocationsService } from '../services/physical-locations.service';
import { CreatePhysicalLocationDto, UpdatePhysicalLocationDto, LocationSearchDto } from '../dto';
import { 
  IPhysicalLocationResponse, 
  IPhysicalLocationFilter, 
  IPhysicalLocationAnalytics, 
  IPhysicalLocationSearchResult,
  INearbyLocationsResult,
  ILocationPriceComparison,
  ILocationBusinessHours,
  ILocationCapacityStatus,
  ILocationAmenitiesInfo
} from '../interfaces/physical-location.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { LocationStatus, LocationType } from '../entities/physical-location.entity';

@ApiTags('Physical Locations')
@Controller('api/v1/physical-locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PhysicalLocationsController {
  constructor(private readonly physicalLocationsService: PhysicalLocationsService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Create a new physical location' })
  @ApiResponse({ status: 201, description: 'Physical location created successfully', type: CreatePhysicalLocationDto })
  @ApiResponse({ status: 400, description: 'Bad request - Location with coordinates already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiBody({ type: CreatePhysicalLocationDto })
  async createPhysicalLocation(
    @Body() createPhysicalLocationDto: CreatePhysicalLocationDto,
    @Request() req: any
  ): Promise<IPhysicalLocationResponse> {
    return this.physicalLocationsService.createPhysicalLocation(createPhysicalLocationDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all physical locations with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Physical locations retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, description, city, or state' })
  @ApiQuery({ name: 'storeId', required: false, type: String, description: 'Filter by store ID' })
  @ApiQuery({ name: 'type', required: false, enum: LocationType, description: 'Filter by location type' })
  @ApiQuery({ name: 'status', required: false, enum: LocationStatus, description: 'Filter by location status' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by state' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Filter by country' })
  @ApiQuery({ name: 'hasParking', required: false, type: Boolean, description: 'Filter by parking availability' })
  @ApiQuery({ name: 'hasWheelchairAccess', required: false, type: Boolean, description: 'Filter by wheelchair access' })
  @ApiQuery({ name: 'hasPublicTransport', required: false, type: Boolean, description: 'Filter by public transport access' })
  @ApiQuery({ name: 'isOpen24Hours', required: false, type: Boolean, description: 'Filter by 24-hour availability' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'currency', required: false, type: String, description: 'Filter by currency' })
  @ApiQuery({ name: 'minCapacity', required: false, type: Number, description: 'Minimum capacity filter' })
  @ApiQuery({ name: 'maxCapacity', required: false, type: Number, description: 'Maximum capacity filter' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'createdAfter', required: false, type: String, description: 'Filter by creation date (ISO string)' })
  @ApiQuery({ name: 'createdBefore', required: false, type: String, description: 'Filter by creation date (ISO string)' })
  async getAllPhysicalLocations(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('hasParking') hasParking?: string,
    @Query('hasWheelchairAccess') hasWheelchairAccess?: string,
    @Query('hasPublicTransport') hasPublicTransport?: string,
    @Query('isOpen24Hours') isOpen24Hours?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('currency') currency?: string,
    @Query('minCapacity') minCapacity?: string,
    @Query('maxCapacity') maxCapacity?: string,
    @Query('createdBy') createdBy?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string
  ): Promise<IPhysicalLocationSearchResult> {
    const filter: IPhysicalLocationFilter = {
      search,
      storeId,
      type: type as any,
      status: status as any,
      city,
      state,
      country,
      hasParking: hasParking === 'true',
      hasWheelchairAccess: hasWheelchairAccess === 'true',
      hasPublicTransport: hasPublicTransport === 'true',
      isOpen24Hours: isOpen24Hours === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      currency,
      minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
      createdBy,
      createdAfter: createdAfter ? new Date(createdAfter) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore) : undefined
    };

    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get physical locations for admin management (with additional filters)' })
  @ApiResponse({ status: 200, description: 'Admin physical locations retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, enum: LocationStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: LocationType, description: 'Filter by type' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by creator ID' })
  async getAdminPhysicalLocations(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('createdBy') createdBy?: string
  ): Promise<IPhysicalLocationSearchResult> {
    const filter: IPhysicalLocationFilter = {
      search,
      status: status as any,
      type: type as any,
      createdBy
    };

    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('analytics')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get physical location analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getPhysicalLocationAnalytics(@Request() req: any): Promise<IPhysicalLocationAnalytics> {
    return this.physicalLocationsService.getPhysicalLocationAnalytics(req.user);
  }

  @Post('nearby')
  @ApiOperation({ summary: 'Find nearby physical locations within a specified radius' })
  @ApiResponse({ status: 200, description: 'Nearby locations found successfully' })
  @ApiBody({ type: LocationSearchDto })
  async findNearbyLocations(
    @Body() searchDto: LocationSearchDto,
    @Request() req: any
  ): Promise<INearbyLocationsResult> {
    return this.physicalLocationsService.findNearbyLocations(searchDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get physical location by ID' })
  @ApiResponse({ status: 200, description: 'Physical location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  async getPhysicalLocationById(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<IPhysicalLocationResponse> {
    return this.physicalLocationsService.getPhysicalLocationById(id, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update physical location by ID' })
  @ApiResponse({ status: 200, description: 'Physical location updated successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  @ApiBody({ type: UpdatePhysicalLocationDto })
  async updatePhysicalLocation(
    @Param('id') id: string,
    @Body() updatePhysicalLocationDto: UpdatePhysicalLocationDto,
    @Request() req: any
  ): Promise<IPhysicalLocationResponse> {
    return this.physicalLocationsService.updatePhysicalLocation(id, updatePhysicalLocationDto, req.user);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete physical location by ID' })
  @ApiResponse({ status: 200, description: 'Physical location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  async deletePhysicalLocation(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    return this.physicalLocationsService.deletePhysicalLocation(id, req.user);
  }

  @Put(':id/status')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Change physical location status' })
  @ApiResponse({ status: 200, description: 'Physical location status changed successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive', 'temporarily_closed', 'permanently_closed', 'under_construction'] } } } })
  async changeLocationStatus(
    @Param('id') id: string,
    @Body('status') status: LocationStatus,
    @Request() req: any
  ): Promise<IPhysicalLocationResponse> {
    return this.physicalLocationsService.changeLocationStatus(id, status, req.user);
  }

  @Get(':id/price-comparison')
  @ApiOperation({ summary: 'Get price comparison for a location with base price' })
  @ApiResponse({ status: 200, description: 'Price comparison retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  @ApiQuery({ name: 'basePrice', required: true, type: Number, description: 'Base price to compare against' })
  async getLocationPriceComparison(
    @Param('id') id: string,
    @Query('basePrice', ParseIntPipe) basePrice: number,
    @Request() req: any
  ): Promise<ILocationPriceComparison> {
    return this.physicalLocationsService.getLocationPriceComparison(id, basePrice, req.user);
  }

  @Get(':id/business-hours')
  @ApiOperation({ summary: 'Get business hours and availability information for a location' })
  @ApiResponse({ status: 200, description: 'Business hours retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  async getLocationBusinessHours(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ILocationBusinessHours> {
    return this.physicalLocationsService.getLocationBusinessHours(id, req.user);
  }

  @Get(':id/capacity-status')
  @ApiOperation({ summary: 'Get capacity status and recommendations for a location' })
  @ApiResponse({ status: 200, description: 'Capacity status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Capacity tracking not enabled' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  async getLocationCapacityStatus(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ILocationCapacityStatus> {
    return this.physicalLocationsService.getLocationCapacityStatus(id, req.user);
  }

  @Get(':id/amenities')
  @ApiOperation({ summary: 'Get amenities and accessibility information for a location' })
  @ApiResponse({ status: 200, description: 'Amenities information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Physical location not found' })
  @ApiParam({ name: 'id', description: 'Physical location ID' })
  async getLocationAmenitiesInfo(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ILocationAmenitiesInfo> {
    return this.physicalLocationsService.getLocationAmenitiesInfo(id, req.user);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all physical locations for a specific store' })
  @ApiResponse({ status: 200, description: 'Store locations retrieved successfully' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  async getLocationsByStore(
    @Param('storeId') storeId: string,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<IPhysicalLocationSearchResult> {
    const filter: IPhysicalLocationFilter = { storeId };
    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('city/:city')
  @ApiOperation({ summary: 'Get all physical locations in a specific city' })
  @ApiResponse({ status: 200, description: 'City locations retrieved successfully' })
  @ApiParam({ name: 'city', description: 'City name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'State filter' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Country filter' })
  async getLocationsByCity(
    @Param('city') city: string,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('state') state?: string,
    @Query('country') country?: string
  ): Promise<IPhysicalLocationSearchResult> {
    const filter: IPhysicalLocationFilter = { city, state, country };
    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get all physical locations of a specific type' })
  @ApiResponse({ status: 200, description: 'Type locations retrieved successfully' })
  @ApiParam({ name: 'type', enum: LocationType, description: 'Location type' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: LocationStatus, description: 'Filter by status' })
  async getLocationsByType(
    @Param('type') type: LocationType,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string
  ): Promise<IPhysicalLocationSearchResult> {
    const filter: IPhysicalLocationFilter = { type, status: status as any };
    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('search/coordinates')
  @ApiOperation({ summary: 'Search locations by coordinate range' })
  @ApiResponse({ status: 200, description: 'Coordinate search completed successfully' })
  @ApiQuery({ name: 'minLat', required: true, type: Number, description: 'Minimum latitude' })
  @ApiQuery({ name: 'maxLat', required: true, type: Number, description: 'Maximum latitude' })
  @ApiQuery({ name: 'minLng', required: true, type: Number, description: 'Minimum longitude' })
  @ApiQuery({ name: 'maxLng', required: true, type: Number, description: 'Maximum longitude' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  async searchByCoordinates(
    @Request() req: any,
    @Query('minLat', ParseIntPipe) minLat: number,
    @Query('maxLat', ParseIntPipe) maxLat: number,
    @Query('minLng', ParseIntPipe) minLng: number,
    @Query('maxLng', ParseIntPipe) maxLng: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<IPhysicalLocationSearchResult> {
    // This would typically use a spatial query
    // For now, we'll use a basic filter approach
    const filter: IPhysicalLocationFilter = {};
    return this.physicalLocationsService.getAllPhysicalLocations(req.user, filter, page, limit);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get summary statistics for physical locations' })
  @ApiResponse({ status: 200, description: 'Summary statistics retrieved successfully' })
  async getLocationSummaryStats(@Request() req: any): Promise<{
    totalLocations: number;
    activeLocations: number;
    locationsByType: Record<string, number>;
    locationsByCountry: Record<string, number>;
    averageCapacity: number;
  }> {
    const analytics = await this.physicalLocationsService.getPhysicalLocationAnalytics(req.user);
    
    return {
      totalLocations: analytics.totalLocations,
      activeLocations: analytics.activeLocations,
      locationsByType: analytics.locationsByType,
      locationsByCountry: analytics.locationsByCountry,
      averageCapacity: analytics.averageCapacity
    };
  }
}
