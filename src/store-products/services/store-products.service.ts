import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreProduct } from '../entities/store-product.entity';
import { CreateStoreProductDto } from '../dto';
import {
  IStoreProductResponse,
  IStoreProductSummary,
  IStoreProductFilter,
} from '../interfaces/store-product.interface';
import { ICategoryResponse } from '../interfaces/category.interface';
import { User } from '../../auth/entities/user.entity';
import { CategoriesService } from './categories.service';
import { ProductMatchingService } from './product-matching.service';
import { StoresService } from '../../stores/services/stores.service';
import { Store } from '../../stores/entities/store.entity';
import { BaseProduct } from '../entities/base-product.entity';
import { DateFormatterUtil } from '../../common/utils/date-formatter.util';

@Injectable()
export class StoreProductsService {
  private readonly logger = new Logger(StoreProductsService.name);

  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(BaseProduct)
    private readonly baseProductRepository: Repository<BaseProduct>,
    private readonly categoriesService: CategoriesService,
    private readonly productMatchingService: ProductMatchingService,
    private readonly storesService: StoresService,
  ) {}

  async createStoreProduct(
    createStoreProductDto: CreateStoreProductDto,
    user: User,
    categoryNames?: string[],
    storeName?: string,
    storeWebsite?: string,
  ): Promise<IStoreProductResponse> {
    // Handle store creation if store name is provided
    let store: Store | undefined = undefined;
    if (storeName) {
      store = await this.storesService.findOrCreateStore(
        storeName,
        storeWebsite,
      );
    }

    // Create individual base product for this store product (NO MATCHING)
    const baseProduct = await this.findOrCreateBaseProductWithStrictMatching(
      createStoreProductDto.name,
      createStoreProductDto.metadata?.brand,
      createStoreProductDto.metadata,
    );

    // Create new store product with base product association
    const storeProduct = this.storeProductRepository.create({
      ...createStoreProductDto,
      baseProductId: baseProduct.id,
      lastScraped: new Date(),
      notes: 'Created from scraping data',
      createdBy: user.id,
      storeId: store?.id || undefined,
    });

    const savedStoreProduct =
      await this.storeProductRepository.save(storeProduct);

    // Handle categories if provided
    if (categoryNames && categoryNames.length > 0) {
      try {
        const categories =
          await this.categoriesService.findOrCreateCategories(categoryNames);

        // Safely associate categories without duplicates
        await this.associateCategoriesSafely(savedStoreProduct.id, categories);

        this.logger.log(
          `Successfully associated ${categories.length} categories with store product ${savedStoreProduct.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Error associating categories with store product ${savedStoreProduct.id}:`,
          error,
        );
        // Continue execution even if categories fail
      }
    }

    // Update base product counters
    await this.productMatchingService.updateProductCounts(baseProduct.id);

    return this.mapToStoreProductResponse(savedStoreProduct);
  }

  async createStoreProductWithBase(
    createStoreProductDto: CreateStoreProductDto,
    user: User,
    baseProductId: string,
    categoryNames?: string[],
    storeName?: string,
    storeWebsite?: string,
  ): Promise<IStoreProductResponse> {
    // Handle store creation if store name is provided
    let store: Store | undefined = undefined;
    if (storeName) {
      store = await this.storesService.findOrCreateStore(
        storeName,
        storeWebsite,
      );
    }

    // Create new store product with base product association
    const storeProduct = this.storeProductRepository.create({
      ...createStoreProductDto,
      baseProductId: baseProductId,
      lastScraped: new Date(),
      notes: 'Created from scraping data with auto-matching',
      createdBy: user.id,
      storeId: store?.id || undefined,
    });

    const savedStoreProduct =
      await this.storeProductRepository.save(storeProduct);

    // Handle categories if provided
    if (categoryNames && categoryNames.length > 0) {
      try {
        const categories =
          await this.categoriesService.findOrCreateCategories(categoryNames);

        // Safely associate categories without duplicates
        await this.associateCategoriesSafely(savedStoreProduct.id, categories);

        this.logger.log(
          `Successfully associated ${categories.length} categories with store product ${savedStoreProduct.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Error associating categories with store product ${savedStoreProduct.id}:`,
          error,
        );
        // Continue execution even if categories fail
      }
    }

    // Update base product counters (async, don't wait)
    this.productMatchingService
      .updateProductCounts(baseProductId)
      .catch((error) => {
        this.logger.error(
          `Error updating product counts for baseProductId ${baseProductId}:`,
          error,
        );
      });

    return this.mapToStoreProductResponse(savedStoreProduct);
  }

  async checkDuplicateStoreProduct(
    storeProductId?: string,
    url?: string,
  ): Promise<StoreProduct | null> {
    if (!storeProductId && !url) {
      return null;
    }

    const queryBuilder =
      this.storeProductRepository.createQueryBuilder('storeProduct');

    if (storeProductId && url) {
      queryBuilder.where(
        '(storeProduct.storeProductId = :storeProductId OR storeProduct.url = :url)',
        { storeProductId, url },
      );
    } else if (storeProductId) {
      queryBuilder.where('storeProduct.storeProductId = :storeProductId', {
        storeProductId,
      });
    } else if (url) {
      queryBuilder.where('storeProduct.url = :url', { url });
    }

    return await queryBuilder.getOne();
  }

  async getAllStoreProducts(
    user: User,
    filter: IStoreProductFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: IStoreProductResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoinAndSelect('storeProduct.creator', 'creator')
      .leftJoinAndSelect('storeProduct.store', 'store')
      .leftJoinAndSelect('storeProduct.categories', 'categories')
      .orderBy('storeProduct.createdAt', 'DESC');

    // Apply filters
    this.applyStoreProductFilters(queryBuilder, filter);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [storeProducts, total] = await queryBuilder.getManyAndCount();

    return {
      data: storeProducts.map((sp) => this.mapToStoreProductResponse(sp)),
      total,
      page,
      limit,
    };
  }

  async getStoreProductById(
    id: string,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['creator', 'store', 'categories'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID ${id} not found`);
    }

    return this.mapToStoreProductResponse(storeProduct);
  }

  async updateStoreProduct(
    id: string,
    updateData: Partial<CreateStoreProductDto>,
    user: User,
  ): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['creator', 'store', 'categories'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID ${id} not found`);
    }

    // Force update by explicitly setting new values and saving
    const productToUpdate = await this.storeProductRepository.preload({
      id: id,
      ...updateData,
    });

    if (!productToUpdate) {
      throw new NotFoundException(
        `Store product with ID ${id} could not be preloaded for update`,
      );
    }

    const savedProduct = await this.storeProductRepository.save(productToUpdate);

    // Force update of updatedAt field manually
    await this.storeProductRepository.query(
      'UPDATE store_products SET "updatedAt" = NOW() WHERE id = $1',
      [id],
    );

    // Fetch the updated product to get the correct updatedAt value
    const finalProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['creator', 'store', 'categories'],
    });

    if (!finalProduct) {
      throw new NotFoundException(
        `Store product with ID ${id} not found after update`,
      );
    }

    return this.mapToStoreProductResponse(finalProduct);
  }

  async deleteStoreProduct(id: string, user: User): Promise<void> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID ${id} not found`);
    }

    await this.storeProductRepository.remove(storeProduct);
  }

  // Helper methods
  private applyStoreProductFilters(
    queryBuilder: any,
    filter: IStoreProductFilter,
  ): void {
    if (filter.search) {
      queryBuilder.andWhere('storeProduct.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.createdBy) {
      queryBuilder.andWhere('storeProduct.createdBy = :createdBy', {
        createdBy: filter.createdBy,
      });
    }

    if (filter.dateFrom) {
      queryBuilder.andWhere('storeProduct.createdAt >= :dateFrom', {
        dateFrom: filter.dateFrom,
      });
    }

    if (filter.dateTo) {
      queryBuilder.andWhere('storeProduct.createdAt <= :dateTo', {
        dateTo: filter.dateTo,
      });
    }

    if (filter.storeId) {
      queryBuilder.andWhere('storeProduct.storeId = :storeId', {
        storeId: filter.storeId,
      });
    }
  }

  private mapToStoreProductResponse(
    storeProduct: StoreProduct,
  ): IStoreProductResponse {
    return {
      id: storeProduct.id,
      name: storeProduct.name,
      description: storeProduct.description,
      url: storeProduct.url,
      sku: storeProduct.sku,
      storeProductId: storeProduct.storeProductId,
      image: storeProduct.image,
      metadata: storeProduct.metadata,
      lastScraped: storeProduct.lastScraped
        ? DateFormatterUtil.formatToChileanDateTime(storeProduct.lastScraped)
        : undefined,
      notes: storeProduct.notes,
      createdAt: DateFormatterUtil.formatToChileanDateTime(
        storeProduct.createdAt,
      ),
      updatedAt: DateFormatterUtil.formatToChileanDateTime(
        storeProduct.updatedAt,
      ),
      creatorId: storeProduct.createdBy,
      creatorName: storeProduct.creator
        ? `${storeProduct.creator.firstName} ${storeProduct.creator.lastName}`
        : 'Unknown',
      displayName: storeProduct.displayName,
      createdBy: storeProduct.createdBy,
      storeId: storeProduct.storeId,
      price: storeProduct.price,
      baseProductId: storeProduct.baseProductId,
      baseProduct: storeProduct.baseProduct
        ? {
            id: storeProduct.baseProduct.id,
            name: storeProduct.baseProduct.name,
            brand: storeProduct.baseProduct.brand,
            model: storeProduct.baseProduct.model,
            fullName: storeProduct.baseProduct.fullName,
          }
        : undefined,
      store: storeProduct.store
        ? {
            id: storeProduct.store.id,
            name: storeProduct.store.name,
            website: storeProduct.store.website,
            type: storeProduct.store.type,
            status: storeProduct.store.status,
            category: storeProduct.store.category,
            isVerified: storeProduct.store.isVerified,
            displayName: storeProduct.store.displayName,
          }
        : undefined,
      categories:
        storeProduct.categories?.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          isActive: category.isActive,
          productCount: category.productCount,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          displayName: category.displayName,
        })) || [],
      physicalLocations: storeProduct.physicalLocations || [],
    };
  }

  private mapToStoreProductSummary(
    storeProduct: StoreProduct,
  ): IStoreProductSummary {
    return {
      id: storeProduct.id,
      name: storeProduct.name,
      description: storeProduct.description,
      url: storeProduct.url,
      sku: storeProduct.sku,
      storeProductId: storeProduct.storeProductId,
      image: storeProduct.image,
      price: storeProduct.price,
      lastScraped: storeProduct.lastScraped
        ? DateFormatterUtil.formatToChileanDateTime(storeProduct.lastScraped)
        : undefined,
      createdAt: DateFormatterUtil.formatToChileanDateTime(
        storeProduct.createdAt,
      ),
      creatorName: storeProduct.creator
        ? `${storeProduct.creator.firstName} ${storeProduct.creator.lastName}`
        : 'Unknown',
      categories:
        storeProduct.categories?.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          isActive: category.isActive,
          productCount: category.productCount,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          displayName: category.displayName,
        })) || [],
    };
  }

  /**
   * Check if URL exists in database
   */
  async checkUrlExists(url: string): Promise<boolean> {
    try {
      const existingProduct = await this.storeProductRepository.findOne({
        where: { url: url },
      });

      return !!existingProduct;
    } catch (error) {
      this.logger.error(
        `Error checking URL existence for ${url}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Create individual base product for each store product (NO MATCHING)
   * Each store product gets its own base product - no automatic association
   */
  async findOrCreateBaseProductWithStrictMatching(
    productName: string,
    brand?: string,
    specifications?: Record<string, any>,
  ): Promise<BaseProduct> {
    try {
      this.logger.log(
        `🆕 Creating individual base product for: "${productName}" (brand: "${brand}")`,
      );

      // NO AUTOMATIC MATCHING - Each store product gets its own base product
      // This ensures 1:1 relationship between store products and base products
      // Admin will manually associate them later if needed

      const baseProduct = this.baseProductRepository.create({
        name: productName, // Use original name, not normalized
        brand: brand ? this.normalizeBrand(brand) : undefined,
        model: specifications?.model || null,
        sku: specifications?.sku || null,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      const savedBaseProduct =
        await this.baseProductRepository.save(baseProduct);
      this.logger.log(
        `✅ Created individual base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`,
      );

      return savedBaseProduct;
    } catch (error) {
      this.logger.error(
        `Error creating individual base product for "${productName}":`,
        error,
      );

      // Fallback: create a simple base product
      const fallbackProduct = this.baseProductRepository.create({
        name: productName, // Use original name, not normalized
        brand: brand ? this.normalizeBrand(brand) : undefined,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      return await this.baseProductRepository.save(fallbackProduct);
    }
  }

  async createIndividualBaseProduct(
    productName: string,
    brand?: string,
    specifications?: Record<string, any>,
  ): Promise<BaseProduct> {
    try {
      const normalizedName = this.normalizeProductName(productName);
      const normalizedBrand = brand ? this.normalizeBrand(brand) : null;

      this.logger.log(
        `Creating individual base product for: "${productName}" (brand: "${brand}")`,
      );

      // NO MATCHING - Each store product gets its own base product
      const baseProduct = this.baseProductRepository.create({
        name: productName, // Use original name, not normalized
        brand: normalizedBrand || undefined,
        model: specifications?.model || null,
        sku: specifications?.sku || null,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      const savedBaseProduct =
        await this.baseProductRepository.save(baseProduct);
      this.logger.log(
        `✅ Created individual base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`,
      );

      return savedBaseProduct;
    } catch (error) {
      this.logger.error(
        `Error in createIndividualBaseProduct for "${productName}":`,
        error,
      );

      // Fallback: create a simple base product without matching
      const fallbackProduct = this.baseProductRepository.create({
        name: productName, // Use original name, not normalized
        brand: brand ? this.normalizeBrand(brand) : undefined,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      return await this.baseProductRepository.save(fallbackProduct);
    }
  }

  private normalizeProductName(name: string): string {
    // Keep original case but normalize specific terms
    let normalized = name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(ml|mililitros?)\b/gi, 'ml')
      .replace(/\b(g|gr|gramos?)\b/gi, 'g')
      .replace(/\b(kg|kilos?)\b/gi, 'kg')
      .replace(/\b(m|metros?)\b/gi, 'm')
      .replace(/\b(cm|centimetros?)\b/gi, 'cm')
      .replace(/\b(mm|milimetros?)\b/gi, 'mm')
      .replace(/\b(un|unidades?)\b/gi, 'un')
      .replace(/\b(pzs?|piezas?)\b/gi, 'pzs')
      .replace(
        /\b(megarollo|mega rollo|mega-rollo|megarrollo)\b/gi,
        'Megarollo',
      )
      .replace(/\b(doble hoja|doble-hoja|doblehoja)\b/gi, 'Doble Hoja')
      .replace(/\b(clásica|clasica|classica)\b/gi, 'Clásica')
      .replace(/\b(ultra|ultra-|ultra_)\b/gi, 'Ultra')
      .replace(/\b(gigante|gigante-|gigante_)\b/gi, 'Gigante')
      .replace(/\b(nova|nova-|nova_)\b/gi, 'Nova')
      .replace(/\b(abolengo|abolengo-|abolengo_)\b/gi, 'Abolengo')
      .replace(/\b(elite|elite-|elite_)\b/gi, 'Elite')
      .replace(/\b(scott|scott-|scott_)\b/gi, 'Scott')
      .replace(/\b(favorita|favorita-|favorita_)\b/gi, 'Favorita')
      .replace(/\b(nubelin|nubelín|nubelin-|nubelin_)\b/gi, 'Nubelin')
      .replace(/\b(home care|homecare|home-care)\b/gi, 'Home Care')
      .replace(/\([^)]*\)/g, '')
      .replace(/\.$/, '')
      .replace(/\s+$/, '')
      .replace(
        /\b(de|del|en|con|para|por|sin|sobre|bajo|entre|hasta|desde|durante|mediante|según|tras|ante|contra)\b/gi,
        ' ',
      )
      .replace(/\s+/g, ' ')
      .trim();

    // Normalize order of measurements and quantities
    normalized = this.normalizeMeasurementOrder(normalized);

    return normalized;
  }

  private normalizeMeasurementOrder(name: string): string {
    // Extract all measurements and quantities
    const measurementRegex =
      /\b(\d+(?:\.\d+)?)\s*(m|cm|mm|ml|g|kg|un|pcs?|pack|rollo|rollos)\b/g;
    const measurements: string[] = [];
    let match;

    while ((match = measurementRegex.exec(name)) !== null) {
      measurements.push(match[0]);
    }

    if (measurements.length === 0) return name;

    // Sort measurements: first by type (m, un, etc.), then by value
    const sortedMeasurements = measurements.sort((a, b) => {
      const aValue = parseFloat(a.match(/\d+(?:\.\d+)?/)?.[0] || '0');
      const bValue = parseFloat(b.match(/\d+(?:\.\d+)?/)?.[0] || '0');
      const aUnit = a.replace(/\d+(?:\.\d+)?/, '').trim();
      const bUnit = b.replace(/\d+(?:\.\d+)?/, '').trim();

      // Priority: m, then un, then others
      const unitPriority: { [key: string]: number } = {
        m: 1,
        un: 2,
        pcs: 2,
        rollo: 3,
        rollos: 3,
        pack: 4,
      };
      const aPriority = unitPriority[aUnit] || 5;
      const bPriority = unitPriority[bUnit] || 5;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return aValue - bValue;
    });

    // Replace measurements in the name with sorted ones
    let result = name;
    let measurementIndex = 0;

    result = result.replace(measurementRegex, () => {
      return sortedMeasurements[measurementIndex++] || '';
    });

    return result;
  }

  private normalizeBrand(brand: string): string {
    const normalized = brand
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(nova|nova-|nova_)\b/g, 'nova')
      .replace(/\b(scott|scott-|scott_)\b/g, 'scott')
      .replace(/\b(favorita|favorita-|favorita_)\b/g, 'favorita')
      .replace(/\b(elite|elite-|elite_)\b/g, 'elite')
      .replace(/\b(abolengo|abolengo-|abolengo_)\b/g, 'abolengo')
      .replace(/\b(nubelin|nubelín|nubelin-|nubelin_)\b/g, 'nubelin')
      .replace(/\b(home care|homecare|home-care|home_care)\b/g, 'home care')
      .replace(/\b(merkat|merkat-|merkat_)\b/g, 'merkat')
      .replace(/\b(difem pharma|difem-pharma|difem_pharma)\b/g, 'difem pharma');

    // Capitalize first letter of each word
    return normalized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async findSimilarBaseProducts(
    normalizedName: string,
    normalizedBrand?: string | null,
  ): Promise<BaseProduct[]> {
    const queryBuilder = this.baseProductRepository
      .createQueryBuilder('bp')
      .where('bp.isActive = :isActive', { isActive: true });

    // Brand matching - simplified approach
    if (normalizedBrand) {
      queryBuilder.andWhere(
        '(bp.brand = :brand OR bp.brand ILIKE :brandPattern OR bp.brand IS NULL)',
        {
          brand: normalizedBrand,
          brandPattern: `%${normalizedBrand}%`,
        },
      );
    }

    // Name similarity conditions - find products that share key words
    const nameWords = normalizedName
      .split(' ')
      .filter((word) => word.length > 2);
    if (nameWords.length > 0) {
      // Use a more flexible approach - find products that share at least 2 key words
      const keyWords = nameWords.slice(0, Math.min(5, nameWords.length)); // Use first 5 words

      const nameConditions = keyWords
        .map((word, index) => `bp.name ILIKE :word${index}`)
        .join(' OR ');

      const nameParams = keyWords.reduce((params, word, index) => {
        params[`word${index}`] = `%${word}%`;
        return params;
      }, {});

      queryBuilder.andWhere(`(${nameConditions})`, nameParams);
    }

    queryBuilder.orderBy('bp.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  private findBestMatch(
    normalizedName: string,
    normalizedBrand: string | null,
    products: BaseProduct[],
  ): { product: BaseProduct; similarity: number } | null {
    let bestMatch: { product: BaseProduct; similarity: number } | null = null;
    let bestSimilarity = 0;

    for (const product of products) {
      const similarity = this.calculateSimilarity(
        normalizedName,
        normalizedBrand,
        product,
      );

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { product, similarity };
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(
    normalizedName: string,
    normalizedBrand: string | null,
    product: BaseProduct,
  ): number {
    // EXPERT PATTERN: Check if brands match exactly (case-insensitive)
    const brandMatch = this.areBrandsEqual(normalizedBrand, product.brand);

    if (!brandMatch) {
      // Different brands = different products (unless names are 99%+ similar)
      const nameSimilarity = this.jaroWinklerSimilarity(
        normalizedName,
        product.name,
      );
      if (nameSimilarity < 0.99) {
        return 0; // Different brands, not similar enough
      }
    }

    // Same brand or very similar names - check if it's the same product
    return this.calculateProductSimilarity(normalizedName, product.name);
  }

  private areBrandsEqual(
    brand1: string | null,
    brand2: string | null,
  ): boolean {
    if (!brand1 && !brand2) return true;
    if (!brand1 || !brand2) return false;

    const normalized1 = this.normalizeBrand(brand1).toLowerCase();
    const normalized2 = this.normalizeBrand(brand2).toLowerCase();

    return normalized1 === normalized2;
  }

  private calculateProductSimilarity(name1: string, name2: string): number {
    // Extract key components
    const components1 = this.extractProductComponents(name1);
    const components2 = this.extractProductComponents(name2);

    // Check if it's the same product based on expert rules
    if (this.isSameProduct(components1, components2)) {
      return 1.0; // 100% match - same product
    }

    // Check if it's similar but different (different quantities)
    if (this.isSimilarProduct(components1, components2)) {
      return 0.7; // 70% match - similar but different
    }

    return 0; // Different products
  }

  private extractProductComponents(name: string): {
    brand: string;
    model: string;
    measurements: string[];
    quantities: number[];
  } {
    const normalized = name.toLowerCase();

    // Extract brand
    const brandMatch = normalized.match(
      /\b(nova|scott|favorita|elite|abolengo|nubelin|home care|merkat|difem pharma)\b/,
    );
    const brand = brandMatch ? brandMatch[1] : '';

    // Extract model
    const modelMatch = normalized.match(
      /\b(evolution|clasica|ultra|gigante|doble hoja|mega|premium|pro|max|plus|xl|xxl)\b/,
    );
    const model = modelMatch ? modelMatch[1] : '';

    // Extract measurements and quantities
    const measurements: string[] = [];
    const quantities: number[] = [];

    const measurementRegex =
      /\b(\d+(?:\.\d+)?)\s*(m|cm|mm|ml|g|kg|un|pcs?|pack|rollo|rollos)\b/g;
    let match;
    while ((match = measurementRegex.exec(normalized)) !== null) {
      measurements.push(match[0]);
      if (match[2].includes('un') || match[2].includes('pcs')) {
        quantities.push(parseFloat(match[1]));
      }
    }

    return { brand, model, measurements, quantities };
  }

  private isSameProduct(comp1: any, comp2: any): boolean {
    // Same brand
    if (comp1.brand !== comp2.brand) return false;

    // Same model (or both have no model)
    if (comp1.model !== comp2.model) return false;

    // Same measurements (ignoring order)
    const sorted1 = [...comp1.measurements].sort();
    const sorted2 = [...comp2.measurements].sort();
    if (sorted1.length !== sorted2.length) return false;
    if (!sorted1.every((m, i) => m === sorted2[i])) return false;

    return true;
  }

  private isSimilarProduct(comp1: any, comp2: any): boolean {
    // Same brand and model but different measurements
    return (
      comp1.brand === comp2.brand &&
      comp1.model === comp2.model &&
      comp1.measurements.length > 0 &&
      comp2.measurements.length > 0
    );
  }

  private calculatePenalties(name1: string, name2: string): number {
    let penalties = 0;

    // Extract measurements and quantities
    const measurements1 = this.extractMeasurements(name1);
    const measurements2 = this.extractMeasurements(name2);

    if (measurements1.length > 0 && measurements2.length > 0) {
      // Check if measurements are the same (ignoring order)
      const sorted1 = [...measurements1].sort();
      const sorted2 = [...measurements2].sort();

      if (
        sorted1.length === sorted2.length &&
        sorted1.every((m, i) => m === sorted2[i])
      ) {
        // Same measurements, no penalty
        penalties += 0;
      } else {
        // Check if they have different quantities (different products)
        const quantities1 = measurements1.filter(
          (m) => m.includes('un') || m.includes('pcs'),
        );
        const quantities2 = measurements2.filter(
          (m) => m.includes('un') || m.includes('pcs'),
        );

        if (quantities1.length > 0 && quantities2.length > 0) {
          const q1 = quantities1
            .map((q) => parseInt(q.match(/\d+/)?.[0] || '0'))
            .sort();
          const q2 = quantities2
            .map((q) => parseInt(q.match(/\d+/)?.[0] || '0'))
            .sort();

          if (q1.length === q2.length && q1.every((q, i) => q === q2[i])) {
            // Same quantities, just different measurements - small penalty
            penalties += 0.1;
          } else {
            // Different quantities - HIGH penalty (different products)
            penalties += 0.4;
          }
        } else {
          // Different measurements but not quantities - medium penalty
          penalties += 0.2;
        }
      }
    }

    // Extract models (specific model identifiers)
    const models1 = this.extractModels(name1);
    const models2 = this.extractModels(name2);

    if (models1.length > 0 && models2.length > 0) {
      const hasDifferentModels = !models1.some((m1) =>
        models2.some((m2) => m1 === m2),
      );
      if (hasDifferentModels) {
        penalties += 0.15; // Reduced penalty for different models
      }
    }

    // Extract sizes (size indicators like "xl", "xxl", "gigante")
    const sizes1 = this.extractSizes(name1);
    const sizes2 = this.extractSizes(name2);

    if (sizes1.length > 0 && sizes2.length > 0) {
      const hasDifferentSizes = !sizes1.some((s1) =>
        sizes2.some((s2) => s1 === s2),
      );
      if (hasDifferentSizes) {
        penalties += 0.1; // Reduced penalty for different sizes
      }
    }

    return penalties;
  }

  private extractMeasurements(name: string): string[] {
    const measurementRegex =
      /\b(\d+(?:\.\d+)?)\s*(m|cm|mm|ml|g|kg|un|pcs?|pack|rollo|rollos)\b/g;
    const matches: string[] = [];
    let match;
    while ((match = measurementRegex.exec(name)) !== null) {
      matches.push(match[0].toLowerCase());
    }
    return matches;
  }

  private extractModels(name: string): string[] {
    const modelRegex =
      /\b(ultra|clasica|gigante|xl|xxl|doble\s+hoja|mega|premium|pro|max|plus)\b/g;
    const matches: string[] = [];
    let match;
    while ((match = modelRegex.exec(name)) !== null) {
      matches.push(match[0].toLowerCase());
    }
    return matches;
  }

  private extractSizes(name: string): string[] {
    const sizeRegex =
      /\b(xl|xxl|gigante|mega|mini|small|medium|large|extra\s+large)\b/g;
    const matches: string[] = [];
    let match;
    while ((match = sizeRegex.exec(name)) !== null) {
      matches.push(match[0].toLowerCase());
    }
    return matches;
  }

  private areMeasurementsSimilar(
    measurements1: string[],
    measurements2: string[],
  ): boolean {
    // Extract numeric values for comparison
    const values1 = measurements1.map((m) =>
      parseFloat(m.match(/\d+(?:\.\d+)?/)?.[0] || '0'),
    );
    const values2 = measurements2.map((m) =>
      parseFloat(m.match(/\d+(?:\.\d+)?/)?.[0] || '0'),
    );

    // Check if any values are within 20% of each other
    return values1.some((v1) =>
      values2.some((v2) => Math.abs(v1 - v2) / Math.max(v1, v2) <= 0.2),
    );
  }

  private jaroWinklerSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const jaro = this.jaroSimilarity(s1, s2);
    const winkler = this.winklerBonus(s1, s2);

    return jaro + 0.1 * winkler * (1 - jaro);
  }

  private jaroSimilarity(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 && len2 === 0) return 1.0;
    if (len1 === 0 || len2 === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (
      (matches / len1 +
        matches / len2 +
        (matches - transpositions / 2) / matches) /
      3
    );
  }

  private winklerBonus(s1: string, s2: string): number {
    let i = 0;
    const maxLength = Math.min(s1.length, s2.length, 4);

    while (i < maxLength && s1[i] === s2[i]) {
      i++;
    }

    return i;
  }

  async getUnassociatedStoreProducts(storeId?: string): Promise<any> {
    const queryBuilder = this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoinAndSelect('storeProduct.store', 'store')
      .leftJoinAndSelect('storeProduct.creator', 'creator')
      .where('storeProduct.baseProductId IS NULL');

    if (storeId) {
      queryBuilder.andWhere('storeProduct.storeId = :storeId', { storeId });
    }

    const storeProducts = await queryBuilder
      .orderBy('storeProduct.createdAt', 'DESC')
      .getMany();

    return {
      data: storeProducts.map((sp) => ({
        id: sp.id,
        name: sp.name,
        description: sp.description,
        url: sp.url,
        sku: sp.sku,
        storeProductId: sp.storeProductId,
        image: sp.image,
        price: sp.price,
        lastScraped: sp.lastScraped,
        createdAt: sp.createdAt,
        store: {
          id: sp.store?.id,
          name: sp.store?.name,
          website: sp.store?.website,
        },
        creator: sp.creator
          ? {
              id: sp.creator.id,
              firstName: sp.creator.firstName,
              lastName: sp.creator.lastName,
            }
          : null,
      })),
      total: storeProducts.length,
    };
  }

  /**
   * Safely associate categories with a store product, avoiding duplicates
   */
  private async associateCategoriesSafely(
    storeProductId: string,
    categories: any[],
  ): Promise<void> {
    if (!categories || categories.length === 0) {
      return;
    }

    try {
      // First, get existing category associations
      const existingCategories = await this.storeProductRepository
        .createQueryBuilder('sp')
        .leftJoinAndSelect('sp.categories', 'category')
        .where('sp.id = :storeProductId', { storeProductId })
        .getOne();

      const existingCategoryIds =
        existingCategories?.categories?.map((cat) => cat.id) || [];

      // Filter out categories that are already associated
      const newCategoryIds = categories
        .map((cat) => cat.id)
        .filter((categoryId) => !existingCategoryIds.includes(categoryId));

      if (newCategoryIds.length === 0) {
        this.logger.log(
          `All categories already associated with store product ${storeProductId}`,
        );
        return;
      }

      // Insert only new category associations using raw SQL to avoid TypeORM issues
      if (newCategoryIds.length > 0) {
        const values = newCategoryIds
          .map((categoryId) => `('${storeProductId}', '${categoryId}')`)
          .join(', ');

        await this.storeProductRepository.query(`
          INSERT INTO store_product_categories ("storeProductId", "categoryId") 
          VALUES ${values}
          ON CONFLICT ("storeProductId", "categoryId") DO NOTHING
        `);

        this.logger.log(
          `Associated ${newCategoryIds.length} new categories with store product ${storeProductId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in associateCategoriesSafely for store product ${storeProductId}:`,
        error,
      );
      throw error;
    }
  }
}
