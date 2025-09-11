import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Store,
  StoreStatus,
  StoreType,
  StoreCategory,
} from '../entities/store.entity';
import {
  PhysicalLocation,
  LocationStatus,
} from '../../physical-locations/entities/physical-location.entity';
import {
  StoreProduct,
} from '../../store-products/entities/store-product.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { CreateStoreLocationDto } from '../dto/create-store-location.dto';
import { UpdateStoreLocationDto } from '../dto/update-store-location.dto';
import {
  IStoreResponse,
  IStoreSummary,
  IStoreListResponse,
  IStoreFilters,
  IStoreAnalytics,
} from '../interfaces/store.interface';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(PhysicalLocation)
    private readonly locationRepository: Repository<PhysicalLocation>,
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
  ) {}

  // ===== STORE MANAGEMENT =====

  async findOrCreateStore(storeName: string, website?: string): Promise<Store> {
    // First, try to find existing store by name
    let store = await this.storeRepository.findOne({
      where: { name: storeName },
    });

    if (store) {
      return store;
    }

    // If not found, create new store with minimal data
    const newStore = this.storeRepository.create({
      name: storeName,
      website: website || null,
      description: `Tienda creada automáticamente desde scraping: ${storeName}`,
      type: StoreType.ONLINE, // Default to online
      status: StoreStatus.ACTIVE, // Default to active
      category: StoreCategory.OTHER, // Default category
      isVerified: false, // Will need manual verification
      createdBy: undefined, // No specific creator for auto-created stores
      metadata: {
        autoCreated: true,
        createdFrom: 'scraping',
        originalName: storeName,
        createdAt: new Date().toISOString(),
      },
    } as Partial<Store>);

    return this.storeRepository.save(newStore);
  }

  async createStore(
    createStoreDto: CreateStoreDto,
    currentUser: any,
  ): Promise<Store> {
    // Check if user has permission to create stores
    const canCreate = this.validateStoreCreationPermissions(currentUser);
    if (!canCreate.allowed) {
      throw new ForbiddenException(canCreate.reason);
    }

    // Check if store name or website already exists
    const existingStore = await this.storeRepository.findOne({
      where: [
        { name: createStoreDto.name },
        { website: createStoreDto.website },
      ],
    });

    if (existingStore) {
      throw new BadRequestException(
        'Store with this name or website already exists',
      );
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      createdBy: currentUser.id,
    });

    return this.storeRepository.save(store);
  }

  async getAllStores(
    page: number = 1,
    limit: number = 20,
    filters: IStoreFilters = {},
    currentUser: any,
  ): Promise<IStoreListResponse> {
    const skip = (page - 1) * limit;

    let query = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.creator', 'creator')
      .leftJoinAndSelect('creator.roles', 'roles')
      .leftJoin('store.storeProducts', 'products')
      .leftJoin('store.physicalLocations', 'locations')
      .addSelect('COUNT(DISTINCT products.id)', 'productsCount')
      .addSelect('COUNT(DISTINCT locations.id)', 'locationsCount')
      .groupBy('store.id')
      .addGroupBy('creator.id')
      .addGroupBy('roles.id')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (filters.type) {
      query = query.andWhere('store.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query = query.andWhere('store.status = :status', {
        status: filters.status,
      });
    }

    if (filters.category) {
      query = query.andWhere('store.category = :category', {
        category: filters.category,
      });
    }

    if (filters.country) {
      query = query.andWhere('store.country = :country', {
        country: filters.country,
      });
    }

    if (filters.isVerified !== undefined) {
      query = query.andWhere('store.isVerified = :isVerified', {
        isVerified: filters.isVerified,
      });
    }

    if (filters.hasPhysicalLocations !== undefined) {
      if (filters.hasPhysicalLocations) {
        query = query.andWhere('store.type IN (:...types)', {
          types: [StoreType.PHYSICAL, StoreType.HYBRID],
        });
      } else {
        query = query.andWhere('store.type = :type', {
          type: StoreType.ONLINE,
        });
      }
    }

    if (filters.search) {
      query = query.andWhere(
        '(store.name ILIKE :search OR store.description ILIKE :search OR store.website ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.createdAfter) {
      query = query.andWhere('store.createdAt >= :createdAfter', {
        createdAfter: filters.createdAfter,
      });
    }

    if (filters.createdBefore) {
      query = query.andWhere('store.createdAt <= :createdBefore', {
        createdBefore: filters.createdBefore,
      });
    }

    const [stores, total] = await query.getManyAndCount();

    const storeSummaries: IStoreSummary[] = stores.map((store) => ({
      id: store.id,
      name: store.name,
      website: store.website,
      logo: store.logo,
      type: store.type,
      status: store.status,
      category: store.category,
      country: store.country,
      isVerified: store.isVerified,
      storeProductsCount: parseInt(store['productsCount'] || '0'),
      physicalLocationsCount: parseInt(store['locationsCount'] || '0'),
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    }));

    return {
      stores: storeSummaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters,
    };
  }

  async getStoreById(
    storeId: string,
    userId: string,
    userRoles: string[],
  ): Promise<IStoreResponse> {
    console.log('🔍 Getting store by ID:', storeId);
    console.log('👤 User ID:', userId);
    console.log('🔐 User roles:', userRoles);

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: [
        'creator',
        'creator.roles',
        'storeProducts',
        'physicalLocations',
      ],
    });

    if (!store) {
      console.log('❌ Store not found:', storeId);
      throw new NotFoundException('Store not found');
    }

    console.log('✅ Store found:', {
      id: store.id,
      name: store.name,
      hasCreator: !!store.creator,
      creatorId: store.creator?.id,
      creatorRoles: store.creator?.roles?.length || 0
    });

    // Check if user has permission to view this store
    const canView = this.validateStoreViewPermissions(store, { id: userId, roles: userRoles });
    if (!canView.allowed) {
      console.log('❌ Permission denied:', canView.reason);
      throw new ForbiddenException(canView.reason);
    }

    console.log('✅ Permission granted, mapping store to response...');
    
    try {
      const response = this.mapStoreToResponse(store);
      console.log('✅ Store mapped successfully');
      return response;
    } catch (error) {
      console.log('❌ Error mapping store:', error.message);
      throw error;
    }
  }

  async updateStore(
    storeId: string,
    updateStoreDto: UpdateStoreDto,
    userId: string,
    userRoles: string[],
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has permission to update this store
    const canUpdate = this.validateStoreUpdatePermissions(store, { id: userId, roles: userRoles });
    if (!canUpdate.allowed) {
      throw new ForbiddenException(canUpdate.reason);
    }

    // Check for unique constraints if updating name or website
    if (updateStoreDto.name && updateStoreDto.name !== store.name) {
      const existingStore = await this.storeRepository.findOne({
        where: { name: updateStoreDto.name },
      });
      if (existingStore) {
        throw new BadRequestException('Store with this name already exists');
      }
    }

    // Only check website uniqueness if it's not empty
    if (updateStoreDto.website && updateStoreDto.website.trim() !== '' && updateStoreDto.website !== store.website) {
      const existingStore = await this.storeRepository.findOne({
        where: { website: updateStoreDto.website },
      });
      if (existingStore) {
        throw new BadRequestException('Store with this website already exists');
      }
    }

    // Clean empty strings to undefined to avoid unique constraint violations
    const cleanedDto = { ...updateStoreDto };
    if (cleanedDto.website === '') cleanedDto.website = undefined;
    if (cleanedDto.email === '') cleanedDto.email = undefined;
    if (cleanedDto.phone === '') cleanedDto.phone = undefined;
    if (cleanedDto.logo === '') cleanedDto.logo = undefined;
    if (cleanedDto.country === '') cleanedDto.country = undefined;
    if (cleanedDto.timezone === '') cleanedDto.timezone = undefined;
    if (cleanedDto.description === '') cleanedDto.description = undefined;

    Object.assign(store, cleanedDto);
    return this.storeRepository.save(store);
  }

  async verifyStore(
    storeId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has permission to verify stores (only SUPER_ADMIN and ADMIN)
    // Check for both uppercase and lowercase versions
    const hasSuperAdmin = userRoles.includes('SUPER_ADMIN') || userRoles.includes('super_admin');
    const hasAdmin = userRoles.includes('ADMIN') || userRoles.includes('admin');
    
    if (!hasSuperAdmin && !hasAdmin) {
      throw new ForbiddenException('Only SUPER_ADMIN and ADMIN can verify stores');
    }

    // Update store verification status
    store.status = StoreStatus.ACTIVE;
    store.isVerified = true;
    store.verifiedAt = new Date();
    store.verifiedBy = userId;

    return this.storeRepository.save(store);
  }

  async suspendStore(
    storeId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has permission to suspend stores (only SUPER_ADMIN and ADMIN)
    // Check for both uppercase and lowercase versions
    const hasSuperAdmin = userRoles.includes('SUPER_ADMIN') || userRoles.includes('super_admin');
    const hasAdmin = userRoles.includes('ADMIN') || userRoles.includes('admin');
    
    if (!hasSuperAdmin && !hasAdmin) {
      throw new ForbiddenException('Only SUPER_ADMIN and ADMIN can suspend stores');
    }

    // Update store status to suspended
    store.status = StoreStatus.SUSPENDED;
    store.updatedAt = new Date();

    return this.storeRepository.save(store);
  }

  async reactivateStore(
    storeId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has permission to reactivate stores (only SUPER_ADMIN and ADMIN)
    // Check for both uppercase and lowercase versions
    const hasSuperAdmin = userRoles.includes('SUPER_ADMIN') || userRoles.includes('super_admin');
    const hasAdmin = userRoles.includes('ADMIN') || userRoles.includes('admin');
    
    if (!hasSuperAdmin && !hasAdmin) {
      throw new ForbiddenException('Only SUPER_ADMIN and ADMIN can reactivate stores');
    }

    // Update store status to active
    store.status = StoreStatus.ACTIVE;
    store.updatedAt = new Date();

    return this.storeRepository.save(store);
  }

  async deleteStore(
    storeId: string,
    currentUser: any,
  ): Promise<{ message: string; storeId: string }> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has permission to delete this store
    const canDelete = this.validateStoreDeletionPermissions(store, currentUser);
    if (!canDelete.allowed) {
      throw new ForbiddenException(canDelete.reason);
    }

    // Check if store has associated data
    const hasProducts = await this.storeProductRepository.count({
      where: { storeId },
    });
    const hasLocations = await this.locationRepository.count({
      where: { storeId },
    });

    if (hasProducts > 0 || hasLocations > 0) {
      throw new BadRequestException(
        'Cannot delete store with associated products or locations',
      );
    }

    await this.storeRepository.remove(store);

    return {
      message: 'Store deleted successfully',
      storeId,
    };
  }

  // ===== PHYSICAL LOCATION MANAGEMENT =====

  async createPhysicalLocation(
    createLocationDto: CreateStoreLocationDto,
    currentUser: any,
  ): Promise<PhysicalLocation> {
    // Verify store exists and user has access
    const store = await this.storeRepository.findOne({
      where: { id: createLocationDto.storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const canManage = this.validateLocationManagementPermissions(
      store,
      currentUser,
    );
    if (!canManage.allowed) {
      throw new ForbiddenException(canManage.reason);
    }

    const location = this.locationRepository.create(createLocationDto);
    return this.locationRepository.save(location);
  }

  async updatePhysicalLocation(
    locationId: string,
    updateLocationDto: UpdateStoreLocationDto,
    currentUser: any,
  ): Promise<PhysicalLocation> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
      relations: ['store', 'store.creator'],
    });

    if (!location) {
      throw new NotFoundException('Physical location not found');
    }

    const canManage = this.validateLocationManagementPermissions(
      location.store,
      currentUser,
    );
    if (!canManage.allowed) {
      throw new ForbiddenException(canManage.reason);
    }

    Object.assign(location, updateLocationDto);
    return this.locationRepository.save(location);
  }

  async deletePhysicalLocation(
    locationId: string,
    currentUser: any,
  ): Promise<{ message: string; locationId: string }> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
      relations: ['store', 'store.creator'],
    });

    if (!location) {
      throw new NotFoundException('Physical location not found');
    }

    const canManage = this.validateLocationManagementPermissions(
      location.store,
      currentUser,
    );
    if (!canManage.allowed) {
      throw new ForbiddenException(canManage.reason);
    }

    await this.locationRepository.remove(location);

    return {
      message: 'Physical location deleted successfully',
      locationId,
    };
  }

  // ===== ANALYTICS =====

  async getStoreAnalytics(
    storeId: string,
    currentUser: any,
  ): Promise<IStoreAnalytics> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['creator'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const canView = this.validateStoreViewPermissions(store, currentUser);
    if (!canView.allowed) {
      throw new ForbiddenException(canView.reason);
    }

    // Get store statistics
    const [totalProducts, activeProducts, totalLocations, activeLocations] =
      await Promise.all([
        this.storeProductRepository.count({ where: { storeId } }),
        this.storeProductRepository.count({
          where: { storeId },
        }),
        this.locationRepository.count({ where: { storeId } }),
        this.locationRepository.count({
          where: { storeId, status: LocationStatus.ACTIVE },
        }),
      ]);

    // Get price statistics
    const priceStats = await this.storeProductRepository
      .createQueryBuilder('product')
      .select([
        'AVG(product.onlinePrice) as avgOnlinePrice',
        'AVG(product.physicalPrice) as avgPhysicalPrice',
        'COUNT(CASE WHEN product.physicalPrice IS NULL THEN 1 END) as onlineOnly',
        'COUNT(CASE WHEN product.physicalPrice IS NOT NULL THEN 1 END) as both',
      ])
      .where('product.storeId = :storeId', { storeId })
      .andWhere('product.status = :status', { status: 'active' })
      .getRawOne();

    // Get scraping status
    const scrapingStats = await this.storeProductRepository
      .createQueryBuilder('product')
      .select([
        'MAX(product.lastScraped) as lastScraped',
        'COUNT(CASE WHEN product.lastScraped IS NULL OR product.lastScraped < :yesterday THEN 1 END) as needsScraping',
        'COUNT(CASE WHEN product.status = :errorStatus THEN 1 END) as scrapingErrors',
      ])
      .where('product.storeId = :storeId', { storeId })
      .setParameter('yesterday', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .setParameter('errorStatus', 'error')
      .getRawOne();

    return {
      id: store.id,
      name: store.name,
      totalProducts,
      activeProducts,
      totalLocations,
      activeLocations,
      averageOnlinePrice: parseFloat(priceStats.avgOnlinePrice || '0'),
      averagePhysicalPrice: parseFloat(priceStats.avgPhysicalPrice || '0'),
      priceComparison: {
        onlineOnly: parseInt(priceStats.onlineOnly || '0'),
        physicalOnly: 0, // Not implemented yet
        both: parseInt(priceStats.both || '0'),
        priceDifference: 0, // Calculate if needed
      },
      lastActivity: store.updatedAt,
      scrapingStatus: {
        lastScraped: scrapingStats.lastScraped || store.createdAt,
        productsNeedingScraping: parseInt(scrapingStats.needsScraping || '0'),
        scrapingErrors: parseInt(scrapingStats.scrapingErrors || '0'),
      },
    };
  }

  // ===== PERMISSION VALIDATION =====

  private validateStoreCreationPermissions(currentUser: any): {
    allowed: boolean;
    reason?: string;
  } {
    const userRoles = currentUser.roles?.map((role) => role.name) || [];

    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Only SUPER_ADMIN and ADMIN can create stores',
    };
  }

  private validateStoreViewPermissions(
    store: Store,
    currentUser: any,
  ): { allowed: boolean; reason?: string } {
    // Handle both array of strings and array of objects with name property
    const userRoles = Array.isArray(currentUser.roles) 
      ? currentUser.roles.map(role => typeof role === 'string' ? role : role.name)
      : [];

    // SUPER_ADMIN and ADMIN can view all stores
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN') || 
        userRoles.includes('super_admin') || userRoles.includes('admin')) {
      return { allowed: true };
    }

    // STORE_ADMIN can only view stores they created
    if (userRoles.includes('STORE_ADMIN') || userRoles.includes('store_admin')) {
      if (store.createdBy === currentUser.id) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'STORE_ADMIN can only view their own stores',
      };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions to view stores',
    };
  }

  private validateStoreUpdatePermissions(
    store: Store,
    currentUser: any,
  ): { allowed: boolean; reason?: string } {
    // Handle both array of strings and array of objects with name property
    const userRoles = Array.isArray(currentUser.roles) 
      ? currentUser.roles.map(role => typeof role === 'string' ? role : role.name)
      : [];

    // SUPER_ADMIN can update any store
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('super_admin')) {
      return { allowed: true };
    }

    // ADMIN can update any store
    if (userRoles.includes('ADMIN') || userRoles.includes('admin')) {
      return { allowed: true };
    }

    // STORE_ADMIN can only update stores they created
    if (userRoles.includes('STORE_ADMIN') || userRoles.includes('store_admin')) {
      if (store.createdBy === currentUser.id) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'STORE_ADMIN can only update their own stores',
      };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions to update stores',
    };
  }

  private validateStoreDeletionPermissions(
    store: Store,
    currentUser: any,
  ): { allowed: boolean; reason?: string } {
    const userRoles = currentUser.roles?.map((role) => role.name) || [];

    // Only SUPER_ADMIN can delete stores
    if (userRoles.includes('SUPER_ADMIN')) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Only SUPER_ADMIN can delete stores' };
  }

  private validateLocationManagementPermissions(
    store: Store,
    currentUser: any,
  ): { allowed: boolean; reason?: string } {
    const userRoles = currentUser.roles?.map((role) => role.name) || [];

    // SUPER_ADMIN and ADMIN can manage locations for any store
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
      return { allowed: true };
    }

    // STORE_ADMIN can only manage locations for their own stores
    if (userRoles.includes('STORE_ADMIN')) {
      if (store.createdBy === currentUser.id) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'STORE_ADMIN can only manage locations for their own stores',
      };
    }

    return {
      allowed: false,
      reason: 'Insufficient permissions to manage store locations',
    };
  }

  // ===== UTILITY METHODS =====

  private mapStoreToResponse(store: Store): IStoreResponse {
    return {
      id: store.id,
      name: store.name,
      description: store.description,
      website: store.website,
      logo: store.logo,
      type: store.type,
      status: store.status,
      category: store.category,
      phone: store.phone,
      email: store.email,
      country: store.country,
      timezone: store.timezone,
      isVerified: store.isVerified,
      verifiedAt: store.verifiedAt,
      verifiedBy: store.verifiedBy,
      metadata: store.metadata,
      createdBy: store.createdBy,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      creator: store.creator ? {
        id: store.creator.id,
        username: store.creator.username,
        email: store.creator.email,
        roles:
          store.creator.roles?.map((role) => ({
            id: role.id,
            name: role.name,
            displayName: role.displayName,
          })) || [],
      } : null,
      storeProductsCount: store.storeProducts?.length || 0,
      physicalLocationsCount: store.physicalLocations?.length || 0,
      verificationStatus: store.isVerified
        ? 'verified'
        : store.status === StoreStatus.SUSPENDED
          ? 'suspended'
          : 'pending',
    };
  }
}
