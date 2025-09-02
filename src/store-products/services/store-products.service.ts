import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull, Not, LessThan } from 'typeorm';
import {
  StoreProduct,
  StoreProductStatus,
  Availability,
  ScrapingStatus,
} from '../entities/store-product.entity';
import {
  CreateStoreProductDto,
  UpdateStoreProductDto,
  ScrapingResultDto,
} from '../dto';
import {
  IStoreProductResponse,
  IStoreProductSummary,
  IStoreProductFilter,
  IStoreProductAnalytics,
  IStoreProductSearchResult,
  IScrapingJob,
  IScrapingResult,
} from '../interfaces/store-product.interface';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class StoreProductsService {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createStoreProduct(
    createStoreProductDto: CreateStoreProductDto,
    user: User,
  ): Promise<IStoreProductResponse> {
    // Check if store exists
    const store = await this.storeRepository.findOne({
      where: { id: createStoreProductDto.storeId },
    });

    if (!store) {
      throw new NotFoundException(
        `Store with ID '${createStoreProductDto.storeId}' not found`,
      );
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: createStoreProductDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID '${createStoreProductDto.productId}' not found`,
      );
    }

    // Check if store product combination already exists
    const existingStoreProduct = await this.storeProductRepository.findOne({
      where: {
        storeId: createStoreProductDto.storeId,
        productId: createStoreProductDto.productId,
      },
    });

    if (existingStoreProduct) {
      throw new BadRequestException(
        `Product '${product.name}' is already available in store '${store.name}'`,
      );
    }

    // Create new store product
    const storeProduct = this.storeProductRepository.create({
      ...createStoreProductDto,
      createdBy: user.id,
      scrapingStatus: ScrapingStatus.PENDING,
      nextScrapingDate: new Date(
        Date.now() +
          (createStoreProductDto.scrapingIntervalHours || 24) * 60 * 60 * 1000,
      ),
    });

    const savedStoreProduct =
      await this.storeProductRepository.save(storeProduct);
    return this.mapToStoreProductResponse(savedStoreProduct);
  }

  async getAllStoreProducts(
    user: User,
    filter: IStoreProductFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<IStoreProductSearchResult> {
    const queryBuilder = this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoinAndSelect('storeProduct.store', 'store')
      .leftJoinAndSelect('storeProduct.product', 'product')
      .leftJoinAndSelect('storeProduct.creator', 'creator')
      .orderBy('storeProduct.createdAt', 'DESC');

    // Apply filters
    this.applyStoreProductFilters(queryBuilder, filter);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.offset(offset).limit(limit);

    const [storeProducts, total] = await queryBuilder.getManyAndCount();

    const storeProductSummaries = storeProducts.map((sp) =>
      this.mapToStoreProductSummary(sp),
    );
    const totalPages = Math.ceil(total / limit);

    return {
      storeProducts: storeProductSummaries,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getStoreProductById(
    id: string,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['store', 'product', 'creator', 'verifier'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID '${id}' not found`);
    }

    return this.mapToStoreProductResponse(storeProduct);
  }

  async updateStoreProduct(
    id: string,
    updateStoreProductDto: UpdateStoreProductDto,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['store', 'product', 'creator', 'verifier'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID '${id}' not found`);
    }

    // Check if user can edit this store product
    if (!this.canUserEditStoreProduct(user, storeProduct)) {
      throw new ForbiddenException(
        'You do not have permission to edit this store product',
      );
    }

    // Update store product
    Object.assign(storeProduct, updateStoreProductDto);

    // Update next scraping date if interval changed
    if (updateStoreProductDto.scrapingIntervalHours) {
      storeProduct.nextScrapingDate = new Date(
        Date.now() +
          updateStoreProductDto.scrapingIntervalHours * 60 * 60 * 1000,
      );
    }

    const updatedStoreProduct =
      await this.storeProductRepository.save(storeProduct);
    return this.mapToStoreProductResponse(updatedStoreProduct);
  }

  async deleteStoreProduct(id: string, user: User): Promise<void> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID '${id}' not found`);
    }

    // Check if user can delete this store product
    if (!this.canUserDeleteStoreProduct(user, storeProduct)) {
      throw new ForbiddenException(
        'You do not have permission to delete this store product',
      );
    }

    await this.storeProductRepository.remove(storeProduct);
  }

  async changeStoreProductStatus(
    id: string,
    status: StoreProductStatus,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['store', 'product', 'creator', 'verifier'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID '${id}' not found`);
    }

    // Check if user can change status
    if (!this.canUserChangeStoreProductStatus(user, storeProduct)) {
      throw new ForbiddenException(
        'You do not have permission to change this store product status',
      );
    }

    storeProduct.status = status;
    const updatedStoreProduct =
      await this.storeProductRepository.save(storeProduct);

    return this.mapToStoreProductResponse(updatedStoreProduct);
  }

  async getStoreProductAnalytics(user: User): Promise<IStoreProductAnalytics> {
    // Check if user has permission to view analytics
    if (!this.canUserViewAnalytics(user)) {
      throw new ForbiddenException(
        'You do not have permission to view store product analytics',
      );
    }

    const [
      totalStoreProducts,
      activeStoreProducts,
      inactiveStoreProducts,
      outOfStockProducts,
      productsByStatus,
      productsByAvailability,
      productsByScrapingStatus,
      averageOnlinePrice,
      averagePhysicalPrice,
      totalOnSaleProducts,
      averageDiscountPercentage,
      productsNeedingScraping,
      productsOverdueScraping,
      topStores,
      topProducts,
      recentScrapingActivity,
      priceChangeTrends,
    ] = await Promise.all([
      this.storeProductRepository.count(),
      this.storeProductRepository.count({
        where: { status: StoreProductStatus.ACTIVE },
      }),
      this.storeProductRepository.count({
        where: { status: StoreProductStatus.INACTIVE },
      }),
      this.storeProductRepository.count({
        where: { availability: Availability.OUT_OF_STOCK },
      }),
      this.getProductsByStatus(),
      this.getProductsByAvailability(),
      this.getProductsByScrapingStatus(),
      this.getAverageOnlinePrice(),
      this.getAveragePhysicalPrice(),
      this.storeProductRepository.count({ where: { isOnSale: true } }),
      this.getAverageDiscountPercentage(),
      this.getProductsNeedingScraping(),
      this.getProductsOverdueScraping(),
      this.getTopStores(),
      this.getTopProducts(),
      this.getRecentScrapingActivity(),
      this.getPriceChangeTrends(),
    ]);

    return {
      totalStoreProducts,
      activeStoreProducts,
      inactiveStoreProducts,
      outOfStockProducts,
      productsByStatus,
      productsByAvailability,
      productsByScrapingStatus,
      averageOnlinePrice,
      averagePhysicalPrice,
      totalOnSaleProducts,
      averageDiscountPercentage,
      productsNeedingScraping,
      productsOverdueScraping,
      topStores,
      topProducts,
      recentScrapingActivity,
      priceChangeTrends,
    };
  }

  async getScrapingJobs(
    user: User,
    limit: number = 50,
  ): Promise<IScrapingJob[]> {
    // Check if user has permission to view scraping jobs
    if (!this.canUserViewScrapingJobs(user)) {
      throw new ForbiddenException(
        'You do not have permission to view scraping jobs',
      );
    }

    const storeProducts = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoinAndSelect('storeProduct.store', 'store')
      .leftJoinAndSelect('storeProduct.product', 'product')
      .where('storeProduct.scrapingStatus = :status', {
        status: ScrapingStatus.PENDING,
      })
      .andWhere('storeProduct.nextScrapingDate <= :now', { now: new Date() })
      .orderBy('storeProduct.nextScrapingDate', 'ASC')
      .limit(limit)
      .getMany();

    return storeProducts.map((sp) => ({
      id: sp.id,
      storeProductId: sp.id,
      storeId: sp.storeId,
      storeName: sp.store.name,
      productId: sp.productId,
      productName: sp.product.name,
      url: sp.url,
      status: sp.scrapingStatus,
      priority: this.calculateScrapingPriority(sp),
      scheduledAt: sp.nextScrapingDate,
      retryCount: 0,
      maxRetries: 3,
    }));
  }

  async processScrapingResult(
    scrapingResult: ScrapingResultDto,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id: scrapingResult.storeProductId },
      relations: ['store', 'product', 'creator', 'verifier'],
    });

    if (!storeProduct) {
      throw new NotFoundException(
        `Store product with ID '${scrapingResult.storeProductId}' not found`,
      );
    }

    // Update scraping status
    storeProduct.scrapingStatus = scrapingResult.status;
    storeProduct.lastScraped = new Date();

    // Update prices if provided
    if (scrapingResult.onlinePrice !== undefined) {
      await this.updatePriceHistory(
        storeProduct,
        'online',
        scrapingResult.onlinePrice,
        'scraping',
      );
      storeProduct.onlinePrice = scrapingResult.onlinePrice;
    }

    if (scrapingResult.physicalPrice !== undefined) {
      await this.updatePriceHistory(
        storeProduct,
        'physical',
        scrapingResult.physicalPrice,
        'scraping',
      );
      storeProduct.physicalPrice = scrapingResult.physicalPrice;
    }

    // Update availability if provided
    if (scrapingResult.availability !== undefined) {
      await this.updateAvailabilityHistory(
        storeProduct,
        scrapingResult.availability,
        'scraping',
        scrapingResult.stockQuantity,
      );
      storeProduct.availability = scrapingResult.availability;
    }

    // Update stock quantity if provided
    if (scrapingResult.stockQuantity !== undefined) {
      storeProduct.stockQuantity = scrapingResult.stockQuantity;
    }

    // Update sale information if provided
    if (scrapingResult.isOnSale !== undefined) {
      storeProduct.isOnSale = scrapingResult.isOnSale;
    }

    if (scrapingResult.originalPrice !== undefined) {
      storeProduct.originalPrice = scrapingResult.originalPrice;
    }

    if (scrapingResult.discountPercentage !== undefined) {
      storeProduct.discountPercentage = scrapingResult.discountPercentage;
    }

    if (scrapingResult.saleEndDate !== undefined) {
      storeProduct.saleEndDate = new Date(scrapingResult.saleEndDate);
    }

    // Update scraping history
    await this.updateScrapingHistory(storeProduct, scrapingResult);

    // Calculate next scraping date
    storeProduct.nextScrapingDate = new Date(
      Date.now() + storeProduct.scrapingIntervalHours * 60 * 60 * 1000,
    );

    const updatedStoreProduct =
      await this.storeProductRepository.save(storeProduct);
    return this.mapToStoreProductResponse(updatedStoreProduct);
  }

  // Private helper methods
  private applyStoreProductFilters(
    queryBuilder: any,
    filter: IStoreProductFilter,
  ): void {
    if (filter.search) {
      queryBuilder.andWhere(
        '(storeProduct.name ILIKE :search OR storeProduct.description ILIKE :search OR product.name ILIKE :search OR store.name ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.storeId) {
      queryBuilder.andWhere('storeProduct.storeId = :storeId', {
        storeId: filter.storeId,
      });
    }

    if (filter.productId) {
      queryBuilder.andWhere('storeProduct.productId = :productId', {
        productId: filter.productId,
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('storeProduct.status = :status', {
        status: filter.status,
      });
    }

    if (filter.availability) {
      queryBuilder.andWhere('storeProduct.availability = :availability', {
        availability: filter.availability,
      });
    }

    if (filter.scrapingStatus) {
      queryBuilder.andWhere('storeProduct.scrapingStatus = :scrapingStatus', {
        scrapingStatus: filter.scrapingStatus,
      });
    }

    if (filter.hasOnlinePrice !== undefined) {
      if (filter.hasOnlinePrice) {
        queryBuilder.andWhere(
          'storeProduct.onlinePrice IS NOT NULL AND storeProduct.onlinePrice > 0',
        );
      } else {
        queryBuilder.andWhere(
          '(storeProduct.onlinePrice IS NULL OR storeProduct.onlinePrice = 0)',
        );
      }
    }

    if (filter.hasPhysicalPrice !== undefined) {
      if (filter.hasPhysicalPrice) {
        queryBuilder.andWhere(
          'storeProduct.physicalPrice IS NOT NULL AND storeProduct.physicalPrice > 0',
        );
      } else {
        queryBuilder.andWhere(
          '(storeProduct.physicalPrice IS NULL OR storeProduct.physicalPrice = 0)',
        );
      }
    }

    if (filter.isOnSale !== undefined) {
      queryBuilder.andWhere('storeProduct.isOnSale = :isOnSale', {
        isOnSale: filter.isOnSale,
      });
    }

    if (filter.minPrice !== undefined) {
      queryBuilder.andWhere(
        '(storeProduct.onlinePrice >= :minPrice OR storeProduct.physicalPrice >= :minPrice)',
        { minPrice: filter.minPrice },
      );
    }

    if (filter.maxPrice !== undefined) {
      queryBuilder.andWhere(
        '(storeProduct.onlinePrice <= :maxPrice OR storeProduct.physicalPrice <= :maxPrice)',
        { maxPrice: filter.maxPrice },
      );
    }

    if (filter.currency) {
      queryBuilder.andWhere('storeProduct.currency = :currency', {
        currency: filter.currency,
      });
    }

    if (filter.minStock !== undefined) {
      queryBuilder.andWhere('storeProduct.stockQuantity >= :minStock', {
        minStock: filter.minStock,
      });
    }

    if (filter.maxStock !== undefined) {
      queryBuilder.andWhere('storeProduct.stockQuantity <= :maxStock', {
        maxStock: filter.maxStock,
      });
    }

    if (filter.needsScraping !== undefined) {
      if (filter.needsScraping) {
        queryBuilder.andWhere('storeProduct.nextScrapingDate <= :now', {
          now: new Date(),
        });
      } else {
        queryBuilder.andWhere('storeProduct.nextScrapingDate > :now', {
          now: new Date(),
        });
      }
    }

    if (filter.createdBy) {
      queryBuilder.andWhere('storeProduct.createdBy = :createdBy', {
        createdBy: filter.createdBy,
      });
    }

    if (filter.createdAfter) {
      queryBuilder.andWhere('storeProduct.createdAt >= :createdAfter', {
        createdAfter: filter.createdAfter,
      });
    }

    if (filter.createdBefore) {
      queryBuilder.andWhere('storeProduct.createdAt <= :createdBefore', {
        createdBefore: filter.createdBefore,
      });
    }

    if (filter.lastScrapedAfter) {
      queryBuilder.andWhere('storeProduct.lastScraped >= :lastScrapedAfter', {
        lastScrapedAfter: filter.lastScrapedAfter,
      });
    }

    if (filter.lastScrapedBefore) {
      queryBuilder.andWhere('storeProduct.lastScraped <= :lastScrapedBefore', {
        lastScrapedBefore: filter.lastScrapedBefore,
      });
    }
  }

  private canUserEditStoreProduct(
    user: User,
    storeProduct: StoreProduct,
  ): boolean {
    const userRoles = user.roles.map((role) => role.name.toLowerCase());
    return (
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.STORE_ADMIN) ||
      storeProduct.createdBy === user.id
    );
  }

  private canUserDeleteStoreProduct(
    user: User,
    storeProduct: StoreProduct,
  ): boolean {
    const userRoles = user.roles.map((role) => role.name.toLowerCase());
    return (
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.ADMIN)
    );
  }

  private canUserChangeStoreProductStatus(
    user: User,
    storeProduct: StoreProduct,
  ): boolean {
    const userRoles = user.roles.map((role) => role.name.toLowerCase());
    return (
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.STORE_ADMIN)
    );
  }

  private canUserViewAnalytics(user: User): boolean {
    const userRoles = user.roles.map((role) => role.name.toLowerCase());
    return (
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.STORE_ADMIN)
    );
  }

  private canUserViewScrapingJobs(user: User): boolean {
    const userRoles = user.roles.map((role) => role.name.toLowerCase());
    return (
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.STORE_ADMIN)
    );
  }

  private calculateScrapingPriority(
    storeProduct: StoreProduct,
  ): 'low' | 'normal' | 'high' | 'urgent' {
    if (storeProduct.scrapingOverdue) return 'urgent';
    if (storeProduct.needsScraping) return 'high';
    if (storeProduct.status === StoreProductStatus.ACTIVE) return 'normal';
    return 'low';
  }

  private async updatePriceHistory(
    storeProduct: StoreProduct,
    type: 'online' | 'physical',
    price: number,
    source: 'scraping' | 'manual',
  ): Promise<void> {
    if (!storeProduct.priceHistory) {
      storeProduct.priceHistory = [];
    }

    storeProduct.priceHistory.push({
      timestamp: new Date(),
      price,
      currency: storeProduct.currency,
      type,
      source,
    });

    // Keep only last 100 price entries
    if (storeProduct.priceHistory.length > 100) {
      storeProduct.priceHistory = storeProduct.priceHistory.slice(-100);
    }
  }

  private async updateAvailabilityHistory(
    storeProduct: StoreProduct,
    availability: Availability,
    source: 'scraping' | 'manual',
    stockQuantity?: number,
  ): Promise<void> {
    if (!storeProduct.availabilityHistory) {
      storeProduct.availabilityHistory = [];
    }

    storeProduct.availabilityHistory.push({
      timestamp: new Date(),
      availability,
      stockQuantity,
      source,
    });

    // Keep only last 100 availability entries
    if (storeProduct.availabilityHistory.length > 100) {
      storeProduct.availabilityHistory =
        storeProduct.availabilityHistory.slice(-100);
    }
  }

  private async updateScrapingHistory(
    storeProduct: StoreProduct,
    scrapingResult: ScrapingResultDto,
  ): Promise<void> {
    if (!storeProduct.scrapingHistory) {
      storeProduct.scrapingHistory = [];
    }

    storeProduct.scrapingHistory.push({
      timestamp: new Date(),
      status: scrapingResult.status,
      price: scrapingResult.onlinePrice || scrapingResult.physicalPrice,
      availability: scrapingResult.availability,
      stockQuantity: scrapingResult.stockQuantity,
      error: scrapingResult.error,
      responseTime: scrapingResult.responseTime,
    });

    // Keep only last 100 scraping entries
    if (storeProduct.scrapingHistory.length > 100) {
      storeProduct.scrapingHistory = storeProduct.scrapingHistory.slice(-100);
    }
  }

  private mapToStoreProductResponse(
    storeProduct: StoreProduct,
  ): IStoreProductResponse {
    return {
      ...storeProduct,
      storeId: storeProduct.store.id,
      storeName: storeProduct.store.name,
      productId: storeProduct.product.id,
      productName: storeProduct.product.name,
      productCode: storeProduct.product.code,
      creatorId: storeProduct.creator.id,
      creatorName:
        storeProduct.creator.firstName + ' ' + storeProduct.creator.lastName,
      verifierId: storeProduct.verifier?.id,
      verifierName: storeProduct.verifier
        ? storeProduct.verifier.firstName + ' ' + storeProduct.verifier.lastName
        : undefined,
    };
  }

  private mapToStoreProductSummary(
    storeProduct: StoreProduct,
  ): IStoreProductSummary {
    return {
      id: storeProduct.id,
      name: storeProduct.name,
      storeId: storeProduct.store.id,
      storeName: storeProduct.store.name,
      productId: storeProduct.product.id,
      productName: storeProduct.product.name,
      productCode: storeProduct.product.code,
      onlinePrice: storeProduct.onlinePrice,
      physicalPrice: storeProduct.physicalPrice,
      currency: storeProduct.currency,
      availability: storeProduct.availability,
      status: storeProduct.status,
      image: storeProduct.image,
      isOnSale: storeProduct.isOnSale,
      discountPercentage: storeProduct.discountPercentage,
      lastScraped: storeProduct.lastScraped,
      createdAt: storeProduct.createdAt,
    };
  }

  // Analytics helper methods
  private async getProductsByStatus(): Promise<
    Record<StoreProductStatus, number>
  > {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('storeProduct.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('storeProduct.status')
      .getRawMany();

    const productsByStatus: Record<StoreProductStatus, number> = {
      [StoreProductStatus.ACTIVE]: 0,
      [StoreProductStatus.INACTIVE]: 0,
      [StoreProductStatus.OUT_OF_STOCK]: 0,
      [StoreProductStatus.DISCONTINUED]: 0,
      [StoreProductStatus.COMING_SOON]: 0,
      [StoreProductStatus.ERROR]: 0,
    };

    result.forEach((item) => {
      productsByStatus[item.status] = parseInt(item.count);
    });

    return productsByStatus;
  }

  private async getProductsByAvailability(): Promise<
    Record<Availability, number>
  > {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('storeProduct.availability', 'availability')
      .addSelect('COUNT(*)', 'count')
      .groupBy('storeProduct.availability')
      .getRawMany();

    const productsByAvailability: Record<Availability, number> = {
      [Availability.IN_STOCK]: 0,
      [Availability.LOW_STOCK]: 0,
      [Availability.OUT_OF_STOCK]: 0,
      [Availability.PRE_ORDER]: 0,
      [Availability.BACKORDER]: 0,
    };

    result.forEach((item) => {
      productsByAvailability[item.availability] = parseInt(item.count);
    });

    return productsByAvailability;
  }

  private async getProductsByScrapingStatus(): Promise<
    Record<ScrapingStatus, number>
  > {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('storeProduct.scrapingStatus', 'scrapingStatus')
      .addSelect('COUNT(*)', 'count')
      .groupBy('storeProduct.scrapingStatus')
      .getRawMany();

    const productsByScrapingStatus: Record<ScrapingStatus, number> = {
      [ScrapingStatus.PENDING]: 0,
      [ScrapingStatus.IN_PROGRESS]: 0,
      [ScrapingStatus.COMPLETED]: 0,
      [ScrapingStatus.FAILED]: 0,
      [ScrapingStatus.SCHEDULED]: 0,
    };

    result.forEach((item) => {
      productsByScrapingStatus[item.scrapingStatus] = parseInt(item.count);
    });

    return productsByScrapingStatus;
  }

  private async getAverageOnlinePrice(): Promise<number> {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('AVG(storeProduct.onlinePrice)', 'average')
      .where(
        'storeProduct.onlinePrice IS NOT NULL AND storeProduct.onlinePrice > 0',
      )
      .getRawOne();

    return result?.average ? parseFloat(result.average) : 0;
  }

  private async getAveragePhysicalPrice(): Promise<number> {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('AVG(storeProduct.physicalPrice)', 'average')
      .where(
        'storeProduct.physicalPrice IS NOT NULL AND storeProduct.physicalPrice > 0',
      )
      .getRawOne();

    return result?.average ? parseFloat(result.average) : 0;
  }

  private async getAverageDiscountPercentage(): Promise<number> {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('AVG(storeProduct.discountPercentage)', 'average')
      .where(
        'storeProduct.discountPercentage IS NOT NULL AND storeProduct.discountPercentage > 0',
      )
      .getRawOne();

    return result?.average ? parseFloat(result.average) : 0;
  }

  private async getProductsNeedingScraping(): Promise<number> {
    return await this.storeProductRepository.count({
      where: { nextScrapingDate: LessThan(new Date()) },
    });
  }

  private async getProductsOverdueScraping(): Promise<number> {
    const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    return await this.storeProductRepository.count({
      where: { nextScrapingDate: LessThan(overdueDate) },
    });
  }

  private async getTopStores(): Promise<
    Array<{ storeId: string; storeName: string; productCount: number }>
  > {
    return await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoin('storeProduct.store', 'store')
      .select('store.id', 'storeId')
      .addSelect('store.name', 'storeName')
      .addSelect('COUNT(*)', 'productCount')
      .groupBy('store.id')
      .addGroupBy('store.name')
      .orderBy('productCount', 'DESC')
      .limit(10)
      .getRawMany();
  }

  private async getTopProducts(): Promise<
    Array<{ productId: string; productName: string; storeCount: number }>
  > {
    return await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoin('storeProduct.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('COUNT(*)', 'storeCount')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('storeCount', 'DESC')
      .limit(10)
      .getRawMany();
  }

  private async getRecentScrapingActivity(): Promise<
    Array<{ storeProductId: string; status: ScrapingStatus; timestamp: Date }>
  > {
    const storeProducts = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .where('storeProduct.lastScraped IS NOT NULL')
      .orderBy('storeProduct.lastScraped', 'DESC')
      .limit(20)
      .getMany();

    return storeProducts.map((sp) => ({
      storeProductId: sp.id,
      status: sp.scrapingStatus,
      timestamp: sp.lastScraped,
    }));
  }

  private async getPriceChangeTrends(): Promise<
    Array<{ date: string; averagePrice: number; productCount: number }>
  > {
    // This is a simplified version - in a real implementation you'd want more sophisticated date grouping
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .select('DATE(storeProduct.updatedAt)', 'date')
      .addSelect(
        'AVG(COALESCE(storeProduct.onlinePrice, storeProduct.physicalPrice))',
        'averagePrice',
      )
      .addSelect('COUNT(*)', 'productCount')
      .where('storeProduct.updatedAt >= :date', {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }) // Last 30 days
      .groupBy('DATE(storeProduct.updatedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date,
      averagePrice: parseFloat(item.averagePrice) || 0,
      productCount: parseInt(item.productCount),
    }));
  }
}
