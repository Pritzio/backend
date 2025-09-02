import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, Between, In } from 'typeorm';
import {
  PhysicalLocation,
  LocationStatus,
  LocationType,
} from '../entities/physical-location.entity';
import {
  CreatePhysicalLocationDto,
  UpdatePhysicalLocationDto,
  LocationSearchDto,
} from '../dto';
import {
  IPhysicalLocationResponse,
  IPhysicalLocationSummary,
  IPhysicalLocationFilter,
  IPhysicalLocationAnalytics,
  IPhysicalLocationSearchResult,
  INearbyLocationsResult,
  ILocationDistanceResult,
  ILocationPriceComparison,
  ILocationBusinessHours,
  ILocationCapacityStatus,
  ILocationAmenitiesInfo,
} from '../interfaces/physical-location.interface';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';
import { StoreProduct } from '../../store-products/entities/store-product.entity';

@Injectable()
export class PhysicalLocationsService {
  constructor(
    @InjectRepository(PhysicalLocation)
    private readonly physicalLocationRepository: Repository<PhysicalLocation>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
  ) {}

  async createPhysicalLocation(
    createPhysicalLocationDto: CreatePhysicalLocationDto,
    user: User,
  ): Promise<IPhysicalLocationResponse> {
    // Check if user has permission to create locations for this store
    await this.checkStorePermission(createPhysicalLocationDto.storeId, user);

    // Check if location with same coordinates already exists
    const existingLocation = await this.physicalLocationRepository.findOne({
      where: {
        storeId: createPhysicalLocationDto.storeId,
        latitude: createPhysicalLocationDto.latitude,
        longitude: createPhysicalLocationDto.longitude,
      },
    });

    if (existingLocation) {
      throw new BadRequestException(
        'A location with these coordinates already exists for this store',
      );
    }

    const physicalLocation = this.physicalLocationRepository.create({
      ...createPhysicalLocationDto,
      createdBy: user.id,
    });

    const savedLocation =
      await this.physicalLocationRepository.save(physicalLocation);
    return this.mapToResponse(savedLocation);
  }

  async getAllPhysicalLocations(
    user: User,
    filter: IPhysicalLocationFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<IPhysicalLocationSearchResult> {
    const queryBuilder = this.buildFilterQuery(filter, user);

    const [locations, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const mappedLocations = await Promise.all(
      locations.map((location) => this.mapToResponse(location)),
    );

    return {
      locations: mappedLocations,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async getPhysicalLocationById(
    id: string,
    user: User,
  ): Promise<IPhysicalLocationResponse> {
    const location = await this.physicalLocationRepository.findOne({
      where: { id },
      relations: ['store', 'creator'],
    });

    if (!location) {
      throw new NotFoundException(
        `Physical location with ID '${id}' not found`,
      );
    }

    // Check if user has access to this location
    await this.checkLocationAccess(location, user);

    return this.mapToResponse(location);
  }

  async updatePhysicalLocation(
    id: string,
    updatePhysicalLocationDto: UpdatePhysicalLocationDto,
    user: User,
  ): Promise<IPhysicalLocationResponse> {
    const location = await this.physicalLocationRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!location) {
      throw new NotFoundException(
        `Physical location with ID '${id}' not found`,
      );
    }

    // Check if user has permission to update this location
    await this.checkLocationPermission(location, user);

    // If coordinates are being updated, check for duplicates
    if (
      updatePhysicalLocationDto.latitude &&
      updatePhysicalLocationDto.longitude
    ) {
      const existingLocation = await this.physicalLocationRepository.findOne({
        where: {
          storeId: location.storeId,
          latitude: updatePhysicalLocationDto.latitude,
          longitude: updatePhysicalLocationDto.longitude,
          id: location.id,
        },
      });

      if (existingLocation) {
        throw new BadRequestException(
          'A location with these coordinates already exists for this store',
        );
      }
    }

    Object.assign(location, updatePhysicalLocationDto);
    const updatedLocation =
      await this.physicalLocationRepository.save(location);

    return this.mapToResponse(updatedLocation);
  }

  async deletePhysicalLocation(id: string, user: User): Promise<void> {
    const location = await this.physicalLocationRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!location) {
      throw new NotFoundException(
        `Physical location with ID '${id}' not found`,
      );
    }

    // Check if user has permission to delete this location
    await this.checkLocationPermission(location, user);

    // Check if location has associated store products
    const storeProductsCount = await this.storeProductRepository.count({
      where: { storeId: id },
    });

    if (storeProductsCount > 0) {
      throw new BadRequestException(
        `Cannot delete location with ${storeProductsCount} associated store products`,
      );
    }

    await this.physicalLocationRepository.remove(location);
  }

  async changeLocationStatus(
    id: string,
    status: LocationStatus,
    user: User,
  ): Promise<IPhysicalLocationResponse> {
    const location = await this.physicalLocationRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!location) {
      throw new NotFoundException(
        `Physical location with ID '${id}' not found`,
      );
    }

    // Check if user has permission to change status
    await this.checkLocationPermission(location, user);

    location.status = status;
    const updatedLocation =
      await this.physicalLocationRepository.save(location);

    return this.mapToResponse(updatedLocation);
  }

  async getPhysicalLocationAnalytics(
    user: User,
  ): Promise<IPhysicalLocationAnalytics> {
    // Check if user has permission to view analytics
    if (
      !this.hasRole(user, [
        RoleType.SUPER_ADMIN,
        RoleType.ADMIN,
        RoleType.STORE_ADMIN,
      ])
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to view analytics',
      );
    }

    const queryBuilder = this.buildBaseQuery(user);

    const [
      totalLocations,
      activeLocations,
      inactiveLocations,
      locationsByType,
      locationsByStatus,
      locationsByCountry,
      locationsByState,
      capacityStats,
      parkingStats,
      accessibilityStats,
      priceStats,
      openStats,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .where('pl.status = :status', { status: LocationStatus.ACTIVE })
        .getCount(),
      queryBuilder
        .where('pl.status != :status', { status: LocationStatus.ACTIVE })
        .getCount(),
      this.getLocationsByType(user),
      this.getLocationsByStatus(user),
      this.getLocationsByCountry(user),
      this.getLocationsByState(user),
      this.getCapacityStats(user),
      this.getParkingStats(user),
      this.getAccessibilityStats(user),
      this.getPriceStats(user),
      this.getOpenStats(user),
    ]);

    return {
      totalLocations,
      activeLocations,
      inactiveLocations,
      locationsByType,
      locationsByStatus,
      locationsByCountry,
      locationsByState,
      averageCapacity: capacityStats.average,
      locationsWithParking: parkingStats.withParking,
      locationsWithWheelchairAccess: accessibilityStats.withWheelchair,
      locationsWithPublicTransport: accessibilityStats.withPublicTransport,
      averagePrice: priceStats.average,
      priceRange: priceStats.range,
      openLocations: openStats.open,
      closedLocations: openStats.closed,
      locationsNeedingAttention: this.calculateLocationsNeedingAttention(
        activeLocations,
        capacityStats,
      ),
    };
  }

  async findNearbyLocations(
    searchDto: LocationSearchDto,
    user: User,
  ): Promise<INearbyLocationsResult> {
    const {
      latitude,
      longitude,
      radius = 10,
      limit = 20,
      includeOpenOnly = false,
      sortByDistance = true,
    } = searchDto;

    const queryBuilder = this.buildBaseQuery(user)
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:latitude)) * 
            cos(radians(pl.latitude)) * 
            cos(radians(pl.longitude) - radians(:longitude)) + 
            sin(radians(:latitude)) * 
            sin(radians(pl.latitude))
          )
        )`,
        'distance',
      )
      .setParameter('latitude', latitude)
      .setParameter('longitude', longitude)
      .where('pl.status = :status', { status: LocationStatus.ACTIVE });

    if (includeOpenOnly) {
      queryBuilder.andWhere('pl.isOpen24Hours = :isOpen24Hours', {
        isOpen24Hours: true,
      });
    }

    if (sortByDistance) {
      queryBuilder.orderBy('distance', 'ASC');
    }

    const locations = await queryBuilder
      .having('distance <= :radius', { radius })
      .take(limit)
      .getRawAndEntities();

    const locationResults: ILocationDistanceResult[] = await Promise.all(
      locations.entities.map(async (location, index) => {
        const distance = parseFloat(locations.raw[index].distance);
        return {
          location: await this.mapToResponse(location),
          distance,
          estimatedTravelTime: this.calculateEstimatedTravelTime(distance),
          isWithinRadius: distance <= radius,
        };
      }),
    );

    const distances = locationResults.map((lr) => lr.distance);
    const averageDistance =
      distances.length > 0
        ? distances.reduce((sum, d) => sum + d, 0) / distances.length
        : 0;

    return {
      center: { latitude, longitude },
      radius,
      locations: locationResults,
      total: locationResults.length,
      averageDistance,
      closestLocation: locationResults[0],
      farthestLocation: locationResults[locationResults.length - 1],
    };
  }

  async getLocationPriceComparison(
    locationId: string,
    basePrice: number,
    user: User,
  ): Promise<ILocationPriceComparison> {
    const location = await this.getPhysicalLocationById(locationId, user);

    const adjustedPrice = location.physicalPrice || basePrice;
    const adjustments = location.priceAdjustments
      ? Object.values(location.priceAdjustments)
      : [];

    let finalPrice = adjustedPrice;
    const appliedAdjustments: Array<{
      reason: string;
      adjustment: number;
      percentage: boolean;
    }> = [];

    for (const adjustment of adjustments) {
      const now = new Date();
      if (
        now >= adjustment.validFrom &&
        (!adjustment.validTo || now <= adjustment.validTo)
      ) {
        if (adjustment.percentage) {
          finalPrice += (basePrice * adjustment.adjustment) / 100;
        } else {
          finalPrice += adjustment.adjustment;
        }
        appliedAdjustments.push({
          reason: adjustment.reason,
          adjustment: adjustment.adjustment,
          percentage: adjustment.percentage,
        });
      }
    }

    const savings = basePrice - finalPrice;
    const savingsPercentage = basePrice > 0 ? (savings / basePrice) * 100 : 0;

    return {
      locationId: location.id,
      locationName: location.name,
      storeName: location.storeName,
      basePrice,
      adjustedPrice,
      adjustments: appliedAdjustments,
      finalPrice,
      savings,
      savingsPercentage,
    };
  }

  async getLocationBusinessHours(
    locationId: string,
    user: User,
  ): Promise<ILocationBusinessHours> {
    const location = await this.getPhysicalLocationById(locationId, user);

    const todayHours = location.operatingHours
      ? this.getTodayHours(location.operatingHours)
      : null;
    const nextOpenDay = location.operatingHours
      ? this.getNextOpenDay(location.operatingHours)
      : null;
    const isCurrentlyOpen = location.isOpen;

    let timeUntilOpen: number | undefined;
    let timeUntilClose: number | undefined;

    if (todayHours && !todayHours.isOpen) {
      timeUntilOpen = this.calculateTimeUntil(todayHours.open);
    } else if (todayHours && todayHours.isOpen) {
      timeUntilClose = this.calculateTimeUntil(todayHours.close);
    }

    return {
      locationId: location.id,
      locationName: location.name,
      todayHours: todayHours || undefined,
      nextOpenDay: nextOpenDay || undefined,
      isCurrentlyOpen,
      timeUntilOpen,
      timeUntilClose,
      specialHours: location.specialHours,
      holidays: location.holidays,
    };
  }

  async getLocationCapacityStatus(
    locationId: string,
    user: User,
  ): Promise<ILocationCapacityStatus> {
    const location = await this.getPhysicalLocationById(locationId, user);

    if (!location.maxCapacity) {
      throw new BadRequestException(
        'This location does not have capacity tracking enabled',
      );
    }

    const availableSpots = Math.max(
      0,
      (location.maxCapacity || 0) - (location.currentCapacity || 0),
    );
    const recommendedVisitTime = this.getRecommendedVisitTime(location);
    const busyHours = this.getBusyHours(location);
    const quietHours = this.getQuietHours(location);

    return {
      locationId: location.id,
      locationName: location.name,
      currentCapacity: location.currentCapacity || 0,
      maxCapacity: location.maxCapacity || 0,
      capacityPercentage: location.capacityPercentage,
      isAtCapacity: location.isAtCapacity,
      isLowCapacity: location.isLowCapacity,
      availableSpots,
      recommendedVisitTime,
      busyHours,
      quietHours,
    };
  }

  async getLocationAmenitiesInfo(
    locationId: string,
    user: User,
  ): Promise<ILocationAmenitiesInfo> {
    const location = await this.getPhysicalLocationById(locationId, user);

    const parkingInfo = location.hasParking
      ? {
          type: 'Standard',
          availability: location.isAtCapacity
            ? ('limited' as const)
            : ('available' as const),
        }
      : undefined;

    const accessibilityInfo = {
      wheelchairAccess: location.hasWheelchairAccess,
      elevatorAccess: location.hasWheelchairAccess,
      accessibleRestrooms: location.hasWheelchairAccess,
      accessibleParking: location.hasWheelchairAccess && location.hasParking,
    };

    const transportInfo = {
      publicTransport: location.hasPublicTransport,
      busRoutes: location.hasPublicTransport
        ? ['Route 1', 'Route 2']
        : undefined,
      trainStations: location.hasPublicTransport
        ? ['Central Station']
        : undefined,
      bikeRacks: true,
    };

    return {
      locationId: location.id,
      locationName: location.name,
      amenities: location.amenities || [],
      services: location.services || [],
      hasParking: location.hasParking,
      hasWheelchairAccess: location.hasWheelchairAccess,
      hasPublicTransport: location.hasPublicTransport,
      parkingInfo,
      accessibilityInfo,
      transportInfo,
    };
  }

  // Private helper methods
  private async checkStorePermission(
    storeId: string,
    user: User,
  ): Promise<void> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['roles'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    if (
      !this.hasRole(user, [
        RoleType.SUPER_ADMIN,
        RoleType.ADMIN,
        RoleType.STORE_ADMIN,
      ])
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to create locations for this store',
      );
    }
  }

  private async checkLocationAccess(
    location: PhysicalLocation,
    user: User,
  ): Promise<void> {
    if (this.hasRole(user, [RoleType.SUPER_ADMIN, RoleType.ADMIN])) {
      return;
    }

    if (this.hasRole(user, [RoleType.STORE_ADMIN])) {
      const store = await this.storeRepository.findOne({
        where: { id: location.storeId },
        relations: ['roles'],
      });

      if (!store) {
        throw new ForbiddenException('Access denied to this location');
      }
    }
  }

  private async checkLocationPermission(
    location: PhysicalLocation,
    user: User,
  ): Promise<void> {
    if (this.hasRole(user, [RoleType.SUPER_ADMIN, RoleType.ADMIN])) {
      return;
    }

    if (this.hasRole(user, [RoleType.STORE_ADMIN])) {
      const store = await this.storeRepository.findOne({
        where: { id: location.storeId },
        relations: ['roles'],
      });

      if (!store) {
        throw new ForbiddenException(
          'Insufficient permissions to modify this location',
        );
      }
    }
  }

  private hasRole(user: User, allowedRoles: RoleType[]): boolean {
    return user.roles.some((role) => allowedRoles.includes(role.name));
  }

  private buildBaseQuery(user: User): SelectQueryBuilder<PhysicalLocation> {
    let queryBuilder = this.physicalLocationRepository
      .createQueryBuilder('pl')
      .leftJoinAndSelect('pl.store', 'store')
      .leftJoinAndSelect('pl.creator', 'creator');

    // Apply role-based filtering
    if (this.hasRole(user, [RoleType.SUPER_ADMIN, RoleType.ADMIN])) {
      // Super admin and admin can see all locations
      return queryBuilder;
    }

    if (this.hasRole(user, [RoleType.STORE_ADMIN])) {
      // Store admin can only see locations from their stores
      queryBuilder = queryBuilder
        .innerJoin('store.roles', 'storeRole')
        .where('storeRole.userId = :userId', { userId: user.id });
    }

    return queryBuilder;
  }

  private buildFilterQuery(
    filter: IPhysicalLocationFilter,
    user: User,
  ): SelectQueryBuilder<PhysicalLocation> {
    const queryBuilder = this.buildBaseQuery(user);

    if (filter.search) {
      queryBuilder.andWhere(
        '(pl.name ILIKE :search OR pl.description ILIKE :search OR pl.city ILIKE :search OR pl.state ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.storeId) {
      queryBuilder.andWhere('pl.storeId = :storeId', {
        storeId: filter.storeId,
      });
    }

    if (filter.type) {
      queryBuilder.andWhere('pl.type = :type', { type: filter.type });
    }

    if (filter.status) {
      queryBuilder.andWhere('pl.status = :status', { status: filter.status });
    }

    if (filter.city) {
      queryBuilder.andWhere('pl.city ILIKE :city', {
        city: `%${filter.city}%`,
      });
    }

    if (filter.state) {
      queryBuilder.andWhere('pl.state ILIKE :state', {
        state: `%${filter.state}%`,
      });
    }

    if (filter.country) {
      queryBuilder.andWhere('pl.country ILIKE :country', {
        country: `%${filter.country}%`,
      });
    }

    if (filter.hasParking !== undefined) {
      queryBuilder.andWhere('pl.hasParking = :hasParking', {
        hasParking: filter.hasParking,
      });
    }

    if (filter.hasWheelchairAccess !== undefined) {
      queryBuilder.andWhere('pl.hasWheelchairAccess = :hasWheelchairAccess', {
        hasWheelchairAccess: filter.hasWheelchairAccess,
      });
    }

    if (filter.hasPublicTransport !== undefined) {
      queryBuilder.andWhere('pl.hasPublicTransport = :hasPublicTransport', {
        hasPublicTransport: filter.hasPublicTransport,
      });
    }

    if (filter.isOpen24Hours !== undefined) {
      queryBuilder.andWhere('pl.isOpen24Hours = :isOpen24Hours', {
        isOpen24Hours: filter.isOpen24Hours,
      });
    }

    if (filter.minPrice !== undefined) {
      queryBuilder.andWhere('pl.physicalPrice >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }

    if (filter.maxPrice !== undefined) {
      queryBuilder.andWhere('pl.physicalPrice <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    if (filter.currency) {
      queryBuilder.andWhere('pl.currency = :currency', {
        currency: filter.currency,
      });
    }

    if (filter.minCapacity !== undefined) {
      queryBuilder.andWhere('pl.maxCapacity >= :minCapacity', {
        minCapacity: filter.minCapacity,
      });
    }

    if (filter.maxCapacity !== undefined) {
      queryBuilder.andWhere('pl.maxCapacity <= :maxCapacity', {
        maxCapacity: filter.maxCapacity,
      });
    }

    if (filter.createdBy) {
      queryBuilder.andWhere('pl.createdBy = :createdBy', {
        createdBy: filter.createdBy,
      });
    }

    if (filter.createdAfter) {
      queryBuilder.andWhere('pl.createdAt >= :createdAfter', {
        createdAfter: filter.createdAfter,
      });
    }

    if (filter.createdBefore) {
      queryBuilder.andWhere('pl.createdAt <= :createdBefore', {
        createdBefore: filter.createdBefore,
      });
    }

    // Default ordering
    queryBuilder.orderBy('pl.createdAt', 'DESC');

    return queryBuilder;
  }

  private async mapToResponse(
    location: PhysicalLocation,
  ): Promise<IPhysicalLocationResponse> {
    const store = await this.storeRepository.findOne({
      where: { id: location.storeId },
    });
    const creator = await this.userRepository.findOne({
      where: { id: location.createdBy },
    });

    return {
      id: location.id,
      storeId: location.storeId,
      storeName: store?.name || 'Unknown Store',
      name: location.name,
      description: location.description,
      type: location.type,
      status: location.status,
      address: location.address,
      address2: location.address2,
      city: location.city,
      state: location.state,
      country: location.country,
      postalCode: location.postalCode,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone,
      email: location.email,
      website: location.website,
      businessHours: location.businessHours,
      isOpen24Hours: location.isOpen24Hours,
      hasParking: location.hasParking,
      hasWheelchairAccess: location.hasWheelchairAccess,
      hasPublicTransport: location.hasPublicTransport,
      amenities: location.amenities,
      services: location.services,
      physicalPrice: location.physicalPrice,
      currency: location.currency,
      priceAdjustments: location.priceAdjustments,
      maxCapacity: location.maxCapacity,
      currentCapacity: location.currentCapacity,
      operatingHours: location.operatingHours,
      specialHours: location.specialHours,
      holidays: location.holidays,
      metadata: location.metadata,
      createdBy: location.createdBy,
      creatorName: creator?.email ? creator.email : 'Unknown User',
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,

      // Virtual properties
      isActive: location.isActive,
      isOpen: location.isOpen,
      coordinates: location.coordinates,
      fullAddress: location.fullAddress,
      shortAddress: location.shortAddress,
      hasSpecialHours: location.hasSpecialHours,
      hasHolidays: location.hasHolidays,
      hasPriceAdjustments: location.hasPriceAdjustments,
      isAtCapacity: location.isAtCapacity,
      capacityPercentage: location.capacityPercentage,
      isLowCapacity: location.isLowCapacity,
      hasAmenities: location.hasAmenities,
      hasServices: location.hasServices,
    };
  }

  // Analytics helper methods
  private async getLocationsByType(
    user: User,
  ): Promise<Record<LocationType, number>> {
    const result = await this.buildBaseQuery(user)
      .select('pl.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pl.type')
      .getRawMany();

    const typeCounts: Record<LocationType, number> = {
      [LocationType.STORE]: 0,
      [LocationType.WAREHOUSE]: 0,
      [LocationType.DISTRIBUTION_CENTER]: 0,
      [LocationType.PICKUP_POINT]: 0,
      [LocationType.SERVICE_CENTER]: 0,
      [LocationType.SHOWROOM]: 0,
    };

    result.forEach((item) => {
      typeCounts[item.type] = parseInt(item.count);
    });

    return typeCounts;
  }

  private async getLocationsByStatus(
    user: User,
  ): Promise<Record<LocationStatus, number>> {
    const result = await this.buildBaseQuery(user)
      .select('pl.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pl.status')
      .getRawMany();

    const statusCounts: Record<LocationStatus, number> = {
      [LocationStatus.ACTIVE]: 0,
      [LocationStatus.INACTIVE]: 0,
      [LocationStatus.TEMPORARILY_CLOSED]: 0,
      [LocationStatus.PERMANENTLY_CLOSED]: 0,
      [LocationStatus.UNDER_CONSTRUCTION]: 0,
    };

    result.forEach((item) => {
      statusCounts[item.status] = parseInt(item.count);
    });

    return statusCounts;
  }

  private async getLocationsByCountry(
    user: User,
  ): Promise<Record<string, number>> {
    const result = await this.buildBaseQuery(user)
      .select('pl.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pl.country')
      .getRawMany();

    const countryCounts: Record<string, number> = {};
    result.forEach((item) => {
      countryCounts[item.country] = parseInt(item.count);
    });

    return countryCounts;
  }

  private async getLocationsByState(
    user: User,
  ): Promise<Record<string, number>> {
    const result = await this.buildBaseQuery(user)
      .select('pl.state', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pl.state')
      .getRawMany();

    const stateCounts: Record<string, number> = {};
    result.forEach((item) => {
      stateCounts[item.state] = parseInt(item.count);
    });

    return stateCounts;
  }

  private async getCapacityStats(user: User): Promise<{ average: number }> {
    const result = await this.buildBaseQuery(user)
      .select('AVG(pl.maxCapacity)', 'average')
      .where('pl.maxCapacity IS NOT NULL')
      .getRawOne();

    return {
      average: result?.average ? parseFloat(result.average) : 0,
    };
  }

  private async getParkingStats(user: User): Promise<{ withParking: number }> {
    const count = await this.buildBaseQuery(user)
      .where('pl.hasParking = :hasParking', { hasParking: true })
      .getCount();

    return { withParking: count };
  }

  private async getAccessibilityStats(
    user: User,
  ): Promise<{ withWheelchair: number; withPublicTransport: number }> {
    const [wheelchairCount, transportCount] = await Promise.all([
      this.buildBaseQuery(user)
        .where('pl.hasWheelchairAccess = :hasWheelchairAccess', {
          hasWheelchairAccess: true,
        })
        .getCount(),
      this.buildBaseQuery(user)
        .where('pl.hasPublicTransport = :hasPublicTransport', {
          hasPublicTransport: true,
        })
        .getCount(),
    ]);

    return {
      withWheelchair: wheelchairCount,
      withPublicTransport: transportCount,
    };
  }

  private async getPriceStats(user: User): Promise<{
    average: number;
    range: { min: number; max: number; average: number };
  }> {
    const result = await this.buildBaseQuery(user)
      .select('AVG(pl.physicalPrice)', 'average')
      .addSelect('MIN(pl.physicalPrice)', 'min')
      .addSelect('MAX(pl.physicalPrice)', 'max')
      .where('pl.physicalPrice IS NOT NULL')
      .getRawOne();

    const average = result?.average ? parseFloat(result.average) : 0;
    const min = result?.min ? parseFloat(result.min) : 0;
    const max = result?.max ? parseFloat(result.max) : 0;

    return {
      average,
      range: { min, max, average },
    };
  }

  private async getOpenStats(
    user: User,
  ): Promise<{ open: number; closed: number }> {
    const [openCount, closedCount] = await Promise.all([
      this.buildBaseQuery(user)
        .where('pl.isOpen24Hours = :isOpen24Hours', { isOpen24Hours: true })
        .getCount(),
      this.buildBaseQuery(user)
        .where('pl.isOpen24Hours = :isOpen24Hours', { isOpen24Hours: false })
        .getCount(),
    ]);

    return { open: openCount, closed: closedCount };
  }

  private calculateLocationsNeedingAttention(
    activeLocations: number,
    capacityStats: { average: number },
  ): number {
    // Simple heuristic: locations needing attention are those with low capacity or unusual patterns
    return Math.floor(activeLocations * 0.1); // 10% of active locations
  }

  private calculateEstimatedTravelTime(
    distance: number,
    averageSpeedKmH: number = 30,
  ): number {
    return (distance / averageSpeedKmH) * 60; // Return minutes
  }

  private getTodayHours(
    operatingHours: Record<string, any>,
  ): { open: string; close: string; isOpen: boolean } | null {
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()
      .slice(0, 3);
    return operatingHours[today] || null;
  }

  private getNextOpenDay(operatingHours: Record<string, any>): {
    day: string;
    hours: { open: string; close: string; isOpen: boolean };
  } | null {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const today = new Date().getDay();

    for (let i = 1; i <= 7; i++) {
      const dayIndex = (today + i) % 7;
      const dayName = days[dayIndex];
      const dayHours = operatingHours[dayName];

      if (dayHours && dayHours.isOpen) {
        return { day: dayName, hours: dayHours };
      }
    }

    return null;
  }

  private calculateTimeUntil(timeString: string): number {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);

    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    return Math.floor((targetTime.getTime() - now.getTime()) / (1000 * 60)); // Return minutes
  }

  private getRecommendedVisitTime(
    location: IPhysicalLocationResponse,
  ): string | undefined {
    if (location.capacityPercentage < 50) {
      return 'Now - Low capacity';
    } else if (location.capacityPercentage < 80) {
      return 'Within 2 hours - Moderate capacity';
    } else {
      return 'Avoid peak hours - High capacity';
    }
  }

  private getBusyHours(location: IPhysicalLocationResponse): string[] {
    // This would typically come from historical data
    // For now, return common busy hours
    return ['09:00-11:00', '17:00-19:00'];
  }

  private getQuietHours(location: IPhysicalLocationResponse): string[] {
    // This would typically come from historical data
    // For now, return common quiet hours
    return ['11:00-17:00', '19:00-21:00'];
  }
}
