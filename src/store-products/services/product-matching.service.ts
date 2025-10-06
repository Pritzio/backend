import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { BaseProduct } from '../entities/base-product.entity';
import { StoreProduct } from '../entities/store-product.entity';
import { StoreStatus } from '../../stores/entities/store.entity';
import {
  ProductNormalizationService,
  ProductSimilarityService,
} from './product-matching';
import { Store } from 'src/stores/entities/store.entity';

export interface ProductLike {
  id: string;
  name: string;
  brand?: string;
  specifications?: Record<string, any>;
  storeProducts?: StoreProduct[];
}

export interface DuplicateGroup {
  id: string;
  avgSimilarity: number;
  count: number;
  brand: string;
  image: string;
  totalStores: number;
  totalVariants: number;
  products: Array<{
    id: string;
    name: string;
    brand?: string | null;
    image?: string | null;
    url: string | null;
    storeName: string | undefined;
    storeCount: number;
    variants: number;
    createdAt: Date;
  }>;
}

export interface BaseProductWithCounts extends BaseProduct {
  storeCount: number;
  totalVariants: number;
}

export interface ProductComparison {
  baseProduct: BaseProduct;
  storeProducts: StoreProduct[];
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  stores: Array<{
    store: Store;
    product: StoreProduct;
    price: number;
  }>;
}

export interface SimilarProduct {
  id: string;
  name: string;
  brand?: string;
  image: string;
  url: string | null;
  similarity: number;
  storeCount: number;
  totalVariants: number;
  createdAt: Date;
  storeProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    url: string;
    store: string;
  }>;
}

export interface ValidationResult {
  totalProducts: number;
  duplicateGroups: number;
  avgGroupSize: number;
  categories: string[];
}

export interface TestSimilarityResult {
  product1: {
    id: string;
    name: string;
    brand?: string;
    categories: string[];
  };
  product2: {
    id: string;
    name: string;
    brand?: string;
    categories: string[];
  };
  similarity: number;
  breakdown: {
    nameSimilarity: number;
    brandSimilarity: number;
    categorySimilarity: number;
    identicalMeasurements: boolean;
    wordOverlapSimilarity: number;
    stringSimilarity: number;
  };
}

@Injectable()
export class ProductMatchingService {
  private readonly _logger = new Logger(ProductMatchingService.name);
  private readonly _isDevelopment = process.env.NODE_ENV === 'development';

  constructor(
    @InjectRepository(BaseProduct)
    private readonly _baseProductRepository: Repository<BaseProduct>,
    @InjectRepository(StoreProduct)
    private readonly _storeProductRepository: Repository<StoreProduct>,
    private readonly _productNormalizationService: ProductNormalizationService,
    private readonly _productSimilarityService: ProductSimilarityService,
  ) {}

  async findOrCreateMatchingBaseProduct(
    productName: string,
    brand?: string,
    specifications?: Record<string, any>,
    storeId?: string,
  ): Promise<BaseProduct> {
    try {
      const normalizedName =
        this._productNormalizationService.normalizeProductName(productName);
      const normalizedBrand = brand
        ? this._productNormalizationService.normalizeBrand(brand)
        : null;

      this._logger.log(
        `Creating individual base product for: "${productName}" (brand: "${brand}")`,
      );

      // NO AUTOMATIC MATCHING - Each store product gets its own base product
      // This ensures 1:1 relationship between store products and base products
      // Admin will manually associate them later if needed

      // Create new base product for this specific store product
      this._logger.log(
        `Creating individual base product for: "${productName}"`,
      );

      const newBaseProduct = this._baseProductRepository.create({
        name: normalizedName,
        brand: normalizedBrand || undefined,
        model: specifications?.model || null,
        sku: specifications?.sku || null,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      const savedBaseProduct =
        await this._baseProductRepository.save(newBaseProduct);
      this._logger.log(
        `✅ Created individual base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`,
      );

      return savedBaseProduct;
    } catch (error) {
      this._logger.error(
        `Error in findOrCreateMatchingBaseProduct for "${productName}":`,
        error,
      );

      // Fallback: create a simple base product without matching
      const fallbackProduct = this._baseProductRepository.create({
        name: productName,
        brand: brand || undefined,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      return await this._baseProductRepository.save(fallbackProduct);
    }
  }

  async getProductComparison(baseProductId: string): Promise<ProductComparison> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId },
      relations: [
        'storeProducts',
        'storeProducts.store',
        'storeProducts.categories',
      ],
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    const storeProducts =
      baseProduct.storeProducts?.filter((sp) => sp.price && sp.price > 0) || [];
    const prices = storeProducts.map((sp) => sp.price).filter((p) => p > 0);

    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      avg:
        prices.length > 0
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length
          : 0,
    };

    const stores = storeProducts
      .map((sp) => ({
        store: sp.store,
        product: sp,
        price: sp.price,
      }))
      .sort((a, b) => a.price - b.price);

    return {
      baseProduct,
      storeProducts,
      priceRange,
      stores,
    };
  }

  async searchProducts(query: string): Promise<BaseProduct[]> {
    const normalizedQuery =
      this._productNormalizationService.normalizeProductName(query);

    this._logger.log(
      `Searching products with query: "${query}" (normalized: "${normalizedQuery}")`,
    );

    const products = await this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .where('baseProduct.name ILIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('baseProduct.brand ILIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('baseProduct.model ILIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .andWhere('baseProduct.isActive = :isActive', { isActive: true })
      .orderBy('baseProduct.storeCount', 'DESC')
      .addOrderBy('baseProduct.name', 'ASC')
      .getMany();

    this._logger.log(
      `Found ${products.length} products, ${products.filter((p) => !p.isActive).length} inactive`,
    );

    return products;
  }

  async getProductWithImagesAndSpecs(baseProductId: string): Promise<{
    baseProduct: BaseProduct;
    image: string;
    specifications: any;
  }> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId },
      relations: ['storeProducts'],
    });

    if (!baseProduct) {
      throw new Error('Product not found');
    }

    // Get image from first store product
    const firstStoreProduct = baseProduct.storeProducts?.[0];
    const productImage =
      firstStoreProduct?.image ||
      baseProduct.image ||
      'https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true';

    // Get specifications
    const specifications = {
      rating: baseProduct.specifications?.rating || null,
      categories: baseProduct.specifications?.categories || [
        'Toallas de Papel',
      ],
      originalData: {
        brand: baseProduct.brand,
        categories: baseProduct.specifications?.categories || [
          'Toallas de Papel',
        ],
        highResImageUrl: productImage,
      },
    };

    return {
      baseProduct,
      image: productImage,
      specifications,
    };
  }

  async processBatchProducts(
    products: Array<{
      name: string;
      brand?: string;
      specifications?: Record<string, any>;
      storeId?: string;
    }>,
  ): Promise<Map<string, BaseProduct>> {
    const results = new Map<string, BaseProduct>();

    this._logger.log(
      `Processing batch of ${products.length} products for matching`,
    );

    for (const product of products) {
      try {
        const baseProduct = await this.findOrCreateMatchingBaseProduct(
          product.name,
          product.brand,
          product.specifications,
          product.storeId,
        );
        results.set(product.name, baseProduct);
      } catch (error) {
        this._logger.error(
          `Error processing product "${product.name}":`,
          error,
        );
      }
    }

    this._logger.log(
      `Batch processing completed. ${results.size} products processed`,
    );
    return results;
  }

  async updateProductCounts(baseProductId: string): Promise<void> {
    try {
      // Use query builder for more reliable counting
      const storeProducts = await this._storeProductRepository
        .createQueryBuilder('storeProduct')
        .leftJoin('storeProduct.store', 'store')
        .where('storeProduct.baseProductId = :baseProductId', { baseProductId })
        .getMany();

      const uniqueStores = new Set(
        storeProducts.map((sp) => sp.storeId).filter(Boolean),
      );

      await this._baseProductRepository.update(baseProductId, {
        storeCount: uniqueStores.size,
        totalVariants: storeProducts.length,
      });

      this._logger.log(
        `Updated counts for baseProductId ${baseProductId}: ${uniqueStores.size} stores, ${storeProducts.length} variants`,
      );
    } catch (error) {
      this._logger.error(
        `Error updating product counts for baseProductId ${baseProductId}:`,
        error,
      );
      throw error;
    }
  }

  private async _findSimilarBaseProducts(
    normalizedName: string,
    normalizedBrand?: string,
  ): Promise<BaseProduct[]> {
    try {
      // First, try exact brand match with flexible name matching
      let query = this._baseProductRepository
        .createQueryBuilder('baseProduct')
        .where('baseProduct.isActive = :isActive', { isActive: true });

      // If we have a brand, prioritize exact brand matches
      if (normalizedBrand) {
        query.andWhere('LOWER(baseProduct.brand) = LOWER(:exactBrand)', {
          exactBrand: normalizedBrand,
        });
      }

      // Use more flexible name matching - at least 70% of words should match
      const nameWords = normalizedName
        .split(' ')
        .filter((word) => word.length > 2);
      if (nameWords.length > 0) {
        // Create conditions for partial word matches
        const nameConditions = nameWords
          .map(
            (word, index) =>
              `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`,
          )
          .join(' OR ');

        query.andWhere(
          `(${nameConditions})`,
          nameWords.reduce((params, word, index) => {
            params[`nameWord${index}`] = `%${word}%`;
            return params;
          }, {}),
        );
      }

      let exactBrandMatches = await query
        .orderBy('baseProduct.storeCount', 'DESC')
        .limit(10)
        .getMany();

      // If no exact brand matches, try fuzzy brand matching
      if (exactBrandMatches.length === 0 && normalizedBrand) {
        query = this._baseProductRepository
          .createQueryBuilder('baseProduct')
          .where('baseProduct.isActive = :isActive', { isActive: true })
          .andWhere(
            '(LOWER(baseProduct.brand) LIKE LOWER(:brandPattern) OR baseProduct.brand IS NULL)',
            {
              brandPattern: `%${normalizedBrand}%`,
            },
          );

        if (nameWords.length > 0) {
          const nameConditions = nameWords
            .map(
              (word, index) =>
                `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`,
            )
            .join(' OR ');

          query.andWhere(
            `(${nameConditions})`,
            nameWords.reduce((params, word, index) => {
              params[`nameWord${index}`] = `%${word}%`;
              return params;
            }, {}),
          );
        }

        exactBrandMatches = await query
          .orderBy('baseProduct.storeCount', 'DESC')
          .limit(10)
          .getMany();
      }

      // If still no matches, try without brand constraint but with name similarity
      if (exactBrandMatches.length === 0) {
        query = this._baseProductRepository
          .createQueryBuilder('baseProduct')
          .where('baseProduct.isActive = :isActive', { isActive: true });

        if (nameWords.length > 0) {
          const nameConditions = nameWords
            .map(
              (word, index) =>
                `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`,
            )
            .join(' OR ');

          query.andWhere(
            `(${nameConditions})`,
            nameWords.reduce((params, word, index) => {
              params[`nameWord${index}`] = `%${word}%`;
              return params;
            }, {}),
          );
        }

        exactBrandMatches = await query
          .orderBy('baseProduct.storeCount', 'DESC')
          .limit(20)
          .getMany();
      }

      return exactBrandMatches;
    } catch (error) {
      this._logger.error(
        `Error finding similar base products for "${normalizedName}":`,
        error,
      );
      return [];
    }
  }

  private _findBestMatch(
    normalizedName: string,
    normalizedBrand: string | null,
    candidates: BaseProduct[],
  ): { product: BaseProduct; similarity: number } | null {
    let bestMatch: { product: BaseProduct; similarity: number } | null = null;

    for (const candidate of candidates) {
      const similarity = this._productSimilarityService.calculateSimilarity(
        normalizedName,
        normalizedBrand,
        candidate.name,
        candidate.brand,
      );

      // STRICT threshold for matching (85%+ required)
      if (similarity >= 0.85) {
        // If we have a brand match, boost the similarity
        let adjustedSimilarity = similarity;
        if (
          normalizedBrand &&
          candidate.brand &&
          this._productNormalizationService.normalizeBrand(normalizedBrand) ===
            this._productNormalizationService.normalizeBrand(candidate.brand)
        ) {
          adjustedSimilarity = Math.min(1.0, similarity + 0.2);
        }

        // Prioritize products with more stores (more established)
        const storeCountBonus = Math.min(0.1, candidate.storeCount * 0.02);
        adjustedSimilarity = Math.min(
          1.0,
          adjustedSimilarity + storeCountBonus,
        );

        if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
          bestMatch = { product: candidate, similarity: adjustedSimilarity };
        }
      }
    }

    return bestMatch;
  }

  private _areDifferentProductTypes(name1: string, name2: string): boolean {
    // Define product type categories
    const productTypes = {
      cocktailNapkins: ['cóctel', 'cocktail', 'coctel'],
      dinnerNapkins: ['mesa', 'dinner', 'comida', 'lunch'],
      paperTowels: ['papel', 'toalla', 'towel', 'higiénico'],
      facialTissues: ['pañuelo', 'facial', 'kleenex', 'servilleta'],
      cleaningCloths: ['paño', 'cloth', 'limpieza', 'reutilizable'],
      detergent: ['detergente', 'lavado', 'washing'],
      soap: ['jabón', 'soap', 'barra'],
      shampoo: ['shampoo', 'champú', 'hair'],
      sugar: ['azúcar', 'sugar', 'endulzante'],
      flour: ['harina', 'flour', 'trigo'],
      rice: ['arroz', 'rice'],
      pasta: ['pasta', 'fideos', 'noodles'],
      oil: ['aceite', 'oil', 'oliva', 'girasol'],
      salt: ['sal', 'salt'],
      spices: ['especias', 'spices', 'condimentos'],
      food: ['comida', 'food', 'alimento', 'snack'],
      beverage: ['bebida', 'beverage', 'jugo', 'agua'],
    };

    const getProductType = (name: string): string[] => {
      const types: string[] = [];
      for (const [type, keywords] of Object.entries(productTypes)) {
        if (keywords.some((keyword) => name.toLowerCase().includes(keyword))) {
          types.push(type);
        }
      }
      return types;
    };

    const types1 = getProductType(name1);
    const types2 = getProductType(name2);

    // If both have types but no common types, they are different product types
    if (types1.length > 0 && types2.length > 0) {
      const hasCommonType = types1.some((type) => types2.includes(type));
      return !hasCommonType;
    }

    // If one has a type and the other doesn't, consider them different
    if (
      (types1.length > 0 && types2.length === 0) ||
      (types1.length === 0 && types2.length > 0)
    ) {
      return true;
    }

    return false;
  }

  private _hasSignificantMeasurementsDifference(
    name1: string,
    name2: string,
  ): boolean {
    // Extract measurements and quantities from product names
    const extractMeasurements = (name: string) => {
      const measurements: number[] = [];
      const quantities: number[] = [];

      // Look for measurements like 10m, 12m, 100m, 70m, etc.
      const measurementMatches = name.match(
        /(\d+(?:\.\d+)?)\s*(m|metros?|meter)/gi,
      );
      if (measurementMatches) {
        measurements.push(
          ...measurementMatches.map((m) =>
            parseFloat(m.replace(/[^\d.]/g, '')),
          ),
        );
      }

      // Look for quantities like 3un, 8un, 1un, 18un, etc.
      const quantityMatches = name.match(
        /(\d+(?:\.\d+)?)\s*(un|unidades?|units?|rollos?|rolls?|paquetes?|packages?)/gi,
      );
      if (quantityMatches) {
        quantities.push(
          ...quantityMatches.map((q) => parseFloat(q.replace(/[^\d.]/g, ''))),
        );
      }

      return { measurements, quantities };
    };

    const { measurements: m1, quantities: q1 } = extractMeasurements(name1);
    const { measurements: m2, quantities: q2 } = extractMeasurements(name2);

    // Check for significant differences in measurements
    if (m1.length > 0 && m2.length > 0) {
      const max1 = Math.max(...m1);
      const max2 = Math.max(...m2);

      // If measurements differ by more than 10%, they're significantly different
      const ratio = Math.max(max1, max2) / Math.min(max1, max2);
      if (ratio > 1.1) {
        return true;
      }
    }

    // Check for significant differences in quantities
    if (q1.length > 0 && q2.length > 0) {
      const max1 = Math.max(...q1);
      const max2 = Math.max(...q2);

      // If quantities differ by more than 50%, they're significantly different
      const ratio = Math.max(max1, max2) / Math.min(max1, max2);
      if (ratio > 1.5) {
        return true;
      }
    }

    return false;
  }

  private _hasIdenticalMeasurements(name1: string, name2: string): boolean {
    // Extract measurements and quantities from product names
    const extractMeasurements = (name: string) => {
      const measurements: number[] = [];
      const quantities: number[] = [];

      // Look for measurements like 10m, 12m, 100m, 70m, etc.
      const measurementMatches = name.match(
        /(\d+(?:\.\d+)?)\s*(m|metros?|meter)/gi,
      );
      if (measurementMatches) {
        measurements.push(
          ...measurementMatches.map((m) =>
            parseFloat(m.replace(/[^\d.]/g, '')),
          ),
        );
      }

      // Look for quantities like 3un, 8un, 1un, 18un, etc.
      const quantityMatches = name.match(
        /(\d+(?:\.\d+)?)\s*(un|unidades?|units?|rollos?|rolls?|paquetes?|packages?)/gi,
      );
      if (quantityMatches) {
        quantities.push(
          ...quantityMatches.map((q) => parseFloat(q.replace(/[^\d.]/g, ''))),
        );
      }

      return { measurements, quantities };
    };

    const { measurements: m1, quantities: q1 } = extractMeasurements(name1);
    const { measurements: m2, quantities: q2 } = extractMeasurements(name2);

    // Check if measurements are identical
    const measurementsIdentical =
      m1.length > 0 &&
      m2.length > 0 &&
      m1.length === m2.length &&
      m1.every((m, index) => Math.abs(m - m2[index]) < 0.01);

    // Check if quantities are identical
    const quantitiesIdentical =
      q1.length > 0 &&
      q2.length > 0 &&
      q1.length === q2.length &&
      q1.every((q, index) => Math.abs(q - q2[index]) < 0.01);

    return measurementsIdentical && quantitiesIdentical;
  }

  private _isMinorVariation(name1: string, name2: string): boolean {
    // Define minor variations that should not prevent products from being considered similar
    const minorVariations = [
      // Paper towel variations
      { pattern1: /\bclasica\b/i, pattern2: /\bdoble hoja\b/i },
      { pattern1: /\bclasica\b/i, pattern2: /\bultra\b/i },
      { pattern1: /\bclasica\b/i, pattern2: /\bmega\b/i },
      { pattern1: /\bdoble hoja\b/i, pattern2: /\bultra\b/i },
      { pattern1: /\bdoble hoja\b/i, pattern2: /\bmega\b/i },
      { pattern1: /\bultra\b/i, pattern2: /\bmega\b/i },

      // General product variations
      { pattern1: /\bnormal\b/i, pattern2: /\bregular\b/i },
      { pattern1: /\bstandard\b/i, pattern2: /\bnormal\b/i },
      { pattern1: /\bclassic\b/i, pattern2: /\bclasica\b/i },
      { pattern1: /\bpremium\b/i, pattern2: /\bultra\b/i },
    ];

    for (const variation of minorVariations) {
      const hasPattern1 =
        variation.pattern1.test(name1) || variation.pattern1.test(name2);
      const hasPattern2 =
        variation.pattern2.test(name1) || variation.pattern2.test(name2);

      if (hasPattern1 && hasPattern2) {
        return true; // This is a minor variation
      }
    }

    return false;
  }

  private _hasKeyFeatureDifferences(name1: string, name2: string): boolean {
    // Define key features that should match for products to be considered similar
    const keyFeatures = {
      // Paper towel features
      doubleSheet: ['doble hoja', 'doble', 'double sheet', 'double'],
      ultra: ['ultra', 'mega', 'max'],
      aloe: ['aloe', 'aloe vera'],
      // Facial tissue features
      triple: ['triple', 'triple hoja'],
      soft: ['soft', 'suave'],
      // Cleaning cloth features
      reusable: ['reutilizable', 'reusable'],
      maxwipe: ['maxwipe', 'max wipe'],
      // Food features
      organic: ['orgánico', 'organic', 'bio', 'biológico'],
      natural: ['natural', 'sin conservantes', 'preservative free'],
      glutenFree: ['sin gluten', 'gluten free', 'celiaco'],
      sugarFree: ['sin azúcar', 'sugar free', 'sin azucar'],
      lowSodium: ['bajo sodio', 'low sodium', 'reducido sodio'],
      // Sweetener types
      stevia: ['stevia', 'stevia natural'],
      aspartame: ['aspartame', 'aspartamo'],
      sucralose: ['sucralosa', 'sucralose', 'splenda'],
      // Oil types
      oliveOil: ['aceite oliva', 'olive oil', 'oliva extra virgen'],
      sunflowerOil: ['aceite girasol', 'sunflower oil', 'girasol'],
      coconutOil: ['aceite coco', 'coconut oil', 'coco'],
    };

    const getFeatures = (name: string): string[] => {
      const features: string[] = [];
      for (const [feature, keywords] of Object.entries(keyFeatures)) {
        if (keywords.some((keyword) => name.toLowerCase().includes(keyword))) {
          features.push(feature);
        }
      }
      return features;
    };

    const features1 = getFeatures(name1);
    const features2 = getFeatures(name2);

    // Si ambos tienen características pero no comparten ninguna, tienen diferencias clave
    if (features1.length > 0 && features2.length > 0) {
      const hasCommonFeature = features1.some((feature) =>
        features2.includes(feature),
      );
      if (!hasCommonFeature) {
        return true;
      }
    }

    // Comprobar características conflictivas
    const conflictingFeatures = [
      // Paper products
      { feature1: 'doble hoja', feature2: 'triple' },
      { feature1: 'ultra', feature2: 'clasica' },
      { feature1: 'reutilizable', feature2: 'desechable' },
      // Food features
      { feature1: 'orgánico', feature2: 'convencional' },
      { feature1: 'sin gluten', feature2: 'con gluten' },
      { feature1: 'sin azúcar', feature2: 'con azúcar' },
      { feature1: 'bajo sodio', feature2: 'alto sodio' },
      // Sweetener types
      { feature1: 'stevia', feature2: 'aspartame' },
      { feature1: 'stevia', feature2: 'sucralosa' },
      { feature1: 'aspartame', feature2: 'sucralosa' },
      // Oil types
      { feature1: 'aceite oliva', feature2: 'aceite girasol' },
      { feature1: 'aceite oliva', feature2: 'aceite coco' },
      { feature1: 'aceite girasol', feature2: 'aceite coco' },
    ];

    for (const conflict of conflictingFeatures) {
      const hasFeature1 =
        name1.toLowerCase().includes(conflict.feature1) ||
        name2.toLowerCase().includes(conflict.feature1);
      const hasFeature2 =
        name1.toLowerCase().includes(conflict.feature2) ||
        name2.toLowerCase().includes(conflict.feature2);
      if (hasFeature1 && hasFeature2) {
        return true;
      }
    }

    return false;
  }

  // Similarity methods
  async findSimilarProducts(options: {
    name: string;
    brand?: string;
    specifications?: Record<string, any>;
    threshold?: number;
    limit?: number;
  }): Promise<SimilarProduct[]> {
    const {
      name,
      brand,
      specifications,
      threshold = 0.5,
      limit = 10,
    } = options;

    this._logger.log(
      `Finding similar products for: "${name}" (brand: "${brand}", threshold: ${threshold})`,
    );

    try {
      // Get all active base products
      const queryBuilder = this._baseProductRepository
        .createQueryBuilder('baseProduct')
        .leftJoinAndSelect('baseProduct.storeProducts', 'storeProduct')
        .leftJoinAndSelect('storeProduct.store', 'store')
        .leftJoinAndSelect('storeProduct.creator', 'creator')
        .where('baseProduct.isActive = :isActive', { isActive: true });

      // Don't filter by brand for suggestions - we want to find similar products regardless of brand
      // The brand similarity will be calculated in the similarity algorithm

      const baseProducts = await queryBuilder.getMany();

      // Calculate similarities
      const similarities: Array<{
        product: BaseProduct;
        similarity: number;
      }> = [];

      for (const product of baseProducts) {
        const similarity = this._calculateProductSimilarity(
          { id: 'new', name, brand, specifications },
          {
            id: product.id,
            name: product.name,
            brand: product.brand,
            specifications: product.specifications,
          },
          true, // isForSuggestions = true
        );

        if (similarity >= threshold) {
          similarities.push({
            product,
            similarity,
          });
        }
      }

      // Sort by similarity (highest first)
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Smart limiting: If we have truly perfect match (100%), only return that one
      // Otherwise, return top 3 suggestions
      let limitedSimilarities;
      const hasPerfectMatch =
        similarities.length > 0 && similarities[0].similarity >= 1.0;

      if (hasPerfectMatch) {
        // Only return the perfect match
        limitedSimilarities = similarities.slice(0, 1);
        this._logger.log(
          `Found perfect match (${(similarities[0].similarity * 100).toFixed(1)}%), returning only that one`,
        );
      } else {
        // Return top 3 suggestions for all other cases
        limitedSimilarities = similarities.slice(0, Math.min(3, limit));
        this._logger.log(
          `No perfect match found, returning top ${limitedSimilarities.length} suggestions`,
        );
      }

      // Format response
      const similarProducts: SimilarProduct[] = limitedSimilarities.map(
        ({ product, similarity }) => {
          // Get image for the product
          const productImage =
            product.storeProducts?.[0]?.image ||
            product.image ||
            'https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true';

          // Get URL for the product
          const productUrl = product.storeProducts?.[0]?.url || null;

          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            image: productImage,
            url: productUrl,
            similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
            storeCount: product.storeCount || 0,
            totalVariants: product.totalVariants || 0,
            createdAt: product.createdAt,
            storeProducts:
              product.storeProducts?.map((sp: StoreProduct) => ({
                id: sp.id,
                name: sp.name,
                price: sp.price,
                image: sp.image,
                url: sp.url,
                store: sp.store?.name || 'Unknown',
              })) || [],
          };
        },
      );

      this._logger.log(
        `Found ${similarProducts.length} similar products for "${name}"`,
      );

      return similarProducts;
    } catch (error) {
      this._logger.error(
        `Error finding similar products for "${name}":`,
        error,
      );
      throw error;
    }
  }

  // Admin methods

  private _blockingStrategy(
    products: BaseProduct[],
  ): Map<string, BaseProduct[]> {
    const blocks = new Map<string, BaseProduct[]>();
    for (const product of products) {
      const brand = this._productNormalizationService.normalizeBrand(
        product.brand || '',
      );
      const key =
        `${brand}|${(product.name || '').split(' ')[0]}`.toLowerCase();
      if (!blocks.has(key)) {
        blocks.set(key, []);
      }
      blocks.get(key)!.push(product);
      
    }
    return blocks;
  }

  async findDuplicateGroups(
    options: {
      threshold?: number;
      limit?: number;
      brand?: string;
    } = {},
  ): Promise<DuplicateGroup[]> {
    const { threshold = 0.75, limit = 50, brand } = options;
    this._logger.log(
      `🔍 Finding duplicate groups with threshold: ${threshold}, limit: ${limit}`,
    );

    // Get all active base products with their store products and stores
    const queryBuilder = this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .leftJoinAndSelect('baseProduct.storeProducts', 'storeProducts')
      .leftJoinAndSelect('storeProducts.store', 'store')
      .where('baseProduct.isActive = :isActive', { isActive: true })
      .andWhere('store.status = :storeStatus', {
        storeStatus: StoreStatus.ACTIVE,
      });
    if (brand) {
      queryBuilder.andWhere('baseProduct.brand ILIKE :brand', {
        brand: `%${brand}%`,
      });
    }
    const baseProducts = await queryBuilder
      .orderBy('baseProduct.createdAt', 'DESC')
      .getMany();

    this._logger.log(`Total products to process: ${baseProducts.length}`);

    // Create a map for quick product lookup by ID
    const productsById = new Map(baseProducts.map((p) => [p.id, p]));

    // STEP 1: Calculate IDF scores for all product names
    const idfScores = this._calculateIdfScores(baseProducts);

    // STEP 2: Use blocking strategy
    const productBlocks = this._blockingStrategy(baseProducts);
    this._logger.log(`Created ${productBlocks.size} blocks for comparison`);

    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (const block of productBlocks.values()) {
      if (block.length < 2) continue;

      // STEP 3: Build a similarity graph within the block
      const graph = new Map<string, Set<string>>();
      block.forEach((p) => graph.set(p.id, new Set()));

      for (let i = 0; i < block.length; i++) {
        for (let j = i + 1; j < block.length; j++) {
          const product1 = block[i];
          const product2 = block[j];

          // Basic checks
          if (
            !product1.storeProducts ||
            product1.storeProducts.length === 0 ||
            !product2.storeProducts ||
            product2.storeProducts.length === 0
          ) {
            continue;
          }

          // Check for common stores
          const productStoreIds = new Set(
            product1.storeProducts.map((sp) => sp.storeId),
          );
          const candidateStoreIds = new Set(
            product2.storeProducts.map((sp) => sp.storeId),
          );
          const commonStores = [...productStoreIds].filter((id) =>
            candidateStoreIds.has(id),
          );
          if (commonStores.length > 0) {
            continue;
          }

          // Calculate similarity and add edge if above threshold
          let similarity = this._calculateTfidfSimilarity(
            product1,
            product2,
            idfScores,
          );

          // Apply a penalty for different variants to avoid false positives
          const variantPenalty = this._calculateVariantPenalty(
            product1.name,
            product2.name,
          );
          if (variantPenalty > 0) {
            similarity -= variantPenalty;
          }

          if (similarity >= threshold) {
            graph.get(product1.id)!.add(product2.id);
            graph.get(product2.id)!.add(product1.id);
          }
        }
      }

      // STEP 4: Find connected components (the duplicate groups)
      const visitedInBlock = new Set<string>();
      for (const product of block) {
        if (!visitedInBlock.has(product.id) && !processed.has(product.id)) {
          const componentIds = this._findConnectedComponent(
            graph,
            product.id,
            visitedInBlock,
          );

          if (componentIds.length > 1) {
            const componentProducts = componentIds.map(
              (id) => productsById.get(id)!,
            );
            const group = this._createDuplicateGroup(
              componentProducts as BaseProductWithCounts[],
              idfScores,
            );
            if (group) {
              duplicateGroups.push(group);
              componentIds.forEach((id) => processed.add(id));
            }
          }
        }
      }
    }

    // Sort by group size and similarity
    duplicateGroups.sort((a, b) => {
      const countDiff = (b.count ?? 0) - (a.count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.avgSimilarity ?? 0) - (a.avgSimilarity ?? 0);
    });

    // Limit results
    const limitedGroups = duplicateGroups.slice(0, limit);
    this._logger.log(
      `Found ${duplicateGroups.length} duplicate groups (showing ${limitedGroups.length})`,
    );
    return limitedGroups;
  }

  private _calculateIdfScores(products: BaseProduct[]): Map<string, number> {
    const docFrequency = new Map<string, number>();
    const numDocs = products.length;

    for (const product of products) {
      const name = this._productNormalizationService.normalizeProductName(product.name);
      const words = new Set(name.split(/\s+/).filter(w => w.length > 1));
      for (const word of words) {
        docFrequency.set(word, (docFrequency.get(word) || 0) + 1);
      }
    }

    const idfScores = new Map<string, number>();
    for (const [word, freq] of docFrequency.entries()) {
      idfScores.set(word, Math.log(numDocs / (1 + freq)));
    }
    
    return idfScores;
  }
  
  private _calculateTfidfSimilarity(
    product1: BaseProduct,
    product2: BaseProduct,
    idfScores: Map<string, number>,
  ): number {
    const name1 = this._productNormalizationService.normalizeProductName(product1.name);
    const name2 = this._productNormalizationService.normalizeProductName(product2.name);
    const words1 = name1.split(/\s+/).filter(w => w.length > 1);
    const words2 = name2.split(/\s+/).filter(w => w.length > 1);
    
    const termFrequency1 = new Map<string, number>();
    for (const word of words1) {
      termFrequency1.set(word, (termFrequency1.get(word) || 0) + 1);
    }
    
    const termFrequency2 = new Map<string, number>();
    for (const word of words2) {
      termFrequency2.set(word, (termFrequency2.get(word) || 0) + 1);
    }
    
    const allWords = new Set([...words1, ...words2]);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const word of allWords) {
      const tf1 = termFrequency1.get(word) || 0;
      const tf2 = termFrequency2.get(word) || 0;
      const idf = idfScores.get(word) || 0;
      
      const tfidf1 = tf1 * idf;
      const tfidf2 = tf2 * idf;
      
      dotProduct += tfidf1 * tfidf2;
      magnitude1 += tfidf1 * tfidf1;
      magnitude2 += tfidf2 * tfidf2;
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  private _findConnectedComponent(
    graph: Map<string, Set<string>>,
    start: string,
    visited: Set<string>,
  ): string[] {
    const component: string[] = [];
    const queue: string[] = [start];
    visited.add(start);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      const neighbors = graph.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return component;
  }

  // Utility method to validate algorithm performance
  async validateAlgorithm(): Promise<ValidationResult> {
    const allProducts = await this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .leftJoinAndSelect('baseProduct.storeProducts', 'storeProducts')
      .leftJoinAndSelect('storeProducts.store', 'store')
      .where('baseProduct.isActive = :isActive', { isActive: true })
      .andWhere('store.status = :storeStatus', {
        storeStatus: StoreStatus.ACTIVE,
      })
      .getMany();

    const duplicateGroups = await this.findDuplicateGroups({
      threshold: 0.9,
      limit: 100,
    });

    const allCategories = new Set<string>();
    allProducts.forEach((product) => {
      const categories = (product.specifications as any)?.categories || [];
      categories.forEach((cat: string) => allCategories.add(cat));
    });

    const avgGroupSize =
      duplicateGroups.length > 0
        ? duplicateGroups.reduce(
            (sum, group) => sum + (group.count ?? 0),
            0,
          ) / duplicateGroups.length
        : 0;

    return {
      totalProducts: allProducts.length,
      duplicateGroups: duplicateGroups.length,
      avgGroupSize: Math.round(avgGroupSize * 100) / 100,
      categories: Array.from(allCategories).sort(),
    };
  }

  // Test method to debug specific product comparisons
  async testProductSimilarity(
    productId1: string,
    productId2: string,
  ): Promise<TestSimilarityResult> {
    const product1 = await this._baseProductRepository.findOne({
      where: { id: productId1 },
      relations: ['storeProducts', 'storeProducts.store'],
    });

    const product2 = await this._baseProductRepository.findOne({
      where: { id: productId2 },
      relations: ['storeProducts', 'storeProducts.store'],
    });

    if (!product1 || !product2) {
      throw new Error('One or both products not found');
    }

    const similarity = this._calculateProductSimilarity(
      product1,
      product2,
      false,
    );

    // Calculate breakdown
    const name1 = this._productNormalizationService.normalizeProductName(
      product1.name,
    );
    const name2 = this._productNormalizationService.normalizeProductName(
      product2.name,
    );
    const brandSimilarity = this._calculateBrandSimilarity(
      product1.brand,
      product2.brand,
    );
    const categorySimilarity = this._calculateCategorySimilarity(
      product1.specifications,
      product2.specifications,
    );
    const identicalMeasurements = this._hasIdenticalMeasurements(name1, name2);

    const words1 = name1
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .sort();
    const words2 = name2
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .sort();
    const wordOverlapSimilarity = this._calculateWordOverlapSimilarity(
      words1,
      words2,
    );
    const stringSimilarity = this._productSimilarityService.calculateSimilarity(
      name1,
      null,
      name2,
      null,
    );
    const nameSimilarity = Math.max(wordOverlapSimilarity, stringSimilarity);

    return {
      product1: {
        id: product1.id,
        name: product1.name,
        brand: product1.brand,
        categories: (product1.specifications as any)?.categories || [],
      },
      product2: {
        id: product2.id,
        name: product2.name,
        brand: product2.brand,
        categories: (product2.specifications as any)?.categories || [],
      },
      similarity,
      breakdown: {
        nameSimilarity: Math.round(nameSimilarity * 100) / 100,
        brandSimilarity: Math.round(brandSimilarity * 100) / 100,
        categorySimilarity: Math.round(categorySimilarity * 100) / 100,
        identicalMeasurements,
        wordOverlapSimilarity: Math.round(wordOverlapSimilarity * 100) / 100,
        stringSimilarity: Math.round(stringSimilarity * 100) / 100,
      },
    };
  }

  private _calculateProductSimilarity(
    product1: ProductLike,
    product2: ProductLike,
    isForSuggestions: boolean = false,
  ): number {
    const name1 = this._productNormalizationService.normalizeProductName(
      product1.name,
    );
    const name2 = this._productNormalizationService.normalizeProductName(
      product2.name,
    );

    // 1. Verificar si los nombres son exactamente iguales (después de la normalización)
    if (name1 === name2) {
      return 1.0; // 100% similitud para nombres idénticos
    }

    // 2. Calcular la similitud de la marca
    const brandSimilarity = this._calculateBrandSimilarity(
      product1.brand || null,
      product2.brand || null,
    );

    // 3. Verificar tipos de producto
    const differentProductTypes = this._areDifferentProductTypes(name1, name2);
    if (differentProductTypes) {
      return 0.1; // Muy baja similitud para tipos de producto diferentes
    }

    // 4. Verificar categorías
    const categorySimilarity = this._calculateCategorySimilarity(
      product1.specifications,
      product2.specifications,
    );
    if (categorySimilarity < 0.2) {
      return 0.1; // Muy baja similitud para categorías muy diferentes
    }

    // 5. Verificar marcas (umbral más permisivo)
    if (brandSimilarity < 0.7) {
      return 0.05; // Muy baja similitud para marcas diferentes
    }

    // 6. Verificar diferencias en medidas/quantidades de forma ESTRICA
    const nameComparison = this._calculateAdvancedNameSimilarity(name1, name2);
    if (nameComparison.measurementDifference === 'significant') {
      return 0.2; // Baja similitud para medidas significativamente diferentes
    }

    // 7. Calcular la similitud básica basada en nombre y categoría
    let baseSimilarity;
    if (isForSuggestions) {
      // Para sugerencias: más flexible
      baseSimilarity =
        nameComparison.similarity * 0.5 +
        brandSimilarity * 0.3 +
        categorySimilarity * 0.2;
    } else {
      // Para duplicados: requerir similitud de nombre y marca (más permisivo)
      if (brandSimilarity < 0.7) {
        return 0.05; // Muy baja similitud para diferentes marcas
      }
      baseSimilarity =
        nameComparison.similarity * 0.6 +
        brandSimilarity * 0.2 +
        categorySimilarity * 0.2;
    }

    // 8. APLICAR PENALIZACIONES ADICIONALES SIEMPRE
    // Penalización por diferencias en variantes (aunque ya se verificó, para mayor seguridad)
    const variantPenalty = this._calculateVariantPenalty(name1, name2);
    if (variantPenalty > 0) {
      baseSimilarity = Math.max(0, baseSimilarity - variantPenalty);
    }

    // 9. Aumentos por medidas idénticas (solo si no hay diferencias significativas)
    if (nameComparison.measurementDifference === 'identical') {
      baseSimilarity = Math.min(0.95, baseSimilarity + 0.15);
    }

    // 10. Aumento especial para productos Nova con medidas idénticas
    const isNovaProduct1 = product1.brand?.toLowerCase().includes('nova');
    const isNovaProduct2 = product2.brand?.toLowerCase().includes('nova');
    if (
      nameComparison.measurementDifference === 'identical' &&
      isNovaProduct1 &&
      isNovaProduct2
    ) {
      baseSimilarity = Math.min(0.98, baseSimilarity + 0.2);
    }

    // 11. Aumento por palabras en orden diferente
    if (nameComparison.sameWordsDifferentOrder) {
      baseSimilarity = Math.min(0.98, baseSimilarity + 0.1);
    }

    return Math.min(baseSimilarity, 1.0);
  }

  /**
   * Advanced name similarity calculation with word ordering and measurement analysis
   */
  private _calculateAdvancedNameSimilarity(
    name1: string,
    name2: string,
  ): {
    similarity: number;
    measurementDifference: 'identical' | 'minor' | 'significant' | 'none';
    sameWordsDifferentOrder: boolean;
    wordAnalysis: {
      words1: string[];
      words2: string[];
      commonWords: string[];
      uniqueWords1: string[];
      uniqueWords2: string[];
    };
  } {
    // Split and normalize words
    const words1 = name1
      .split(/\s+/)
      .filter((word) => word.length > 1)
      .map((w) => w.toLowerCase());
    const words2 = name2
      .split(/\s+/)
      .filter((word) => word.length > 1)
      .map((w) => w.toLowerCase());

    // Extract quantities (un) from both names
    const quantity1 = this._extractQuantityFromName(name1);
    const quantity2 = this._extractQuantityFromName(name2);

    // Check if quantities are different and significant
    let quantityPenalty = 0;
    if (quantity1 !== null && quantity2 !== null) {
      if (Math.abs(quantity1 - quantity2) >= 1) {
        // At least 1 unit difference - but be more permissive for small differences
        if (Math.abs(quantity1 - quantity2) <= 2) {
          quantityPenalty = 0.1; // Light penalty for small quantity differences
        } else {
          quantityPenalty = 0.3; // Moderate penalty for larger differences
        }
      }
    } else if ((quantity1 === null && quantity2 === 1) || (quantity1 === 1 && quantity2 === null)) {
      // Special case: one has "1un" explicit, other has implicit "1un" - no penalty
      quantityPenalty = 0;
    }

    // Sort words for order-independent comparison
    const sortedWords1 = [...words1].sort();
    const sortedWords2 = [...words2].sort();

    // Check if same words in different order
    const sameWordsDifferentOrder =
      sortedWords1.length === sortedWords2.length &&
      sortedWords1.length >= 2 &&
      sortedWords1.every((word, index) => word === sortedWords2[index]);

    // Find common words (with fuzzy matching)
    const commonWords: string[] = [];
    const uniqueWords1: string[] = [];
    const uniqueWords2: string[] = [];

    for (const word1 of words1) {
      const match = words2.find(
        (word2) =>
          this._productSimilarityService.calculateSimilarity(
            word1,
            null,
            word2,
            null,
          ) > 0.8,
      );
      if (match) {
        commonWords.push(word1);
      } else {
        uniqueWords1.push(word1);
      }
    }

    for (const word2 of words2) {
      const match = words1.find(
        (word1) =>
          this._productSimilarityService.calculateSimilarity(
            word1,
            null,
            word2,
            null,
          ) > 0.8,
      );
      if (!match) {
        uniqueWords2.push(word2);
      }
    }

    // Calculate measurement differences
    const measurementAnalysis = this._analyzeMeasurements(name1, name2);

    // Calculate similarity based on word overlap (more generous)
    const totalWords = Math.max(words1.length, words2.length);
    const wordOverlapSimilarity = commonWords.length / totalWords;
    
    // Bonus for high word overlap
    let adjustedWordOverlap = wordOverlapSimilarity;
    if (commonWords.length >= 4 && wordOverlapSimilarity >= 0.6) {
      // Boost similarity for products with many common words
      adjustedWordOverlap = Math.min(0.95, wordOverlapSimilarity + 0.2);
    }

    // Calculate string similarity as fallback
    const stringSimilarity = this._productSimilarityService.calculateSimilarity(
      name1,
      null,
      name2,
      null,
    );

    // Use the higher of the two similarities
    const similarity = Math.max(adjustedWordOverlap, stringSimilarity);

    // Apply quantity penalty
    let similarityWithPenalty = Math.max(0, similarity - quantityPenalty);

    // NUEVO: Aplicar penalización por diferencias en variantes
    const variantPenalty = this._calculateVariantPenalty(name1, name2);
    if (variantPenalty > 0) {
      similarityWithPenalty = Math.max(0, similarityWithPenalty - variantPenalty);
    }

    return {
      similarity: similarityWithPenalty,
      measurementDifference: measurementAnalysis.difference,
      sameWordsDifferentOrder,
      wordAnalysis: {
        words1,
        words2,
        commonWords,
        uniqueWords1,
        uniqueWords2,
      },
    };
  }

  /**
   * Extrae la cantidad de unidades (un) de un nombre de producto
   */
  private _extractQuantityFromName(name: string): number | null {
    const matches = name.match(
      /(\d+(?:\.\d+)?)\s*(un|unidades?|pcs?|piezas?|paquetes?|c\/?u)/gi,
    );
    if (!matches) return null;

    // Tomar el primer número encontrado (normalmente el principal)
    const firstMatch = matches[0];
    const num = parseFloat(firstMatch.replace(/[^\d.]/g, ''));
    return num;
  }

  /**
   * Calcula una penalización por diferencias en variantes del producto (ej: "evolution" vs "clasica")
   */
  private _calculateVariantPenalty(name1: string, name2: string): number {
    const variants = [
      { name: 'evolution', keywords: ['evolution', 'evol'] },
      {
        name: 'clasica',
        keywords: ['clasica', 'clásica', 'classica', 'standard', 'normal'],
      },
      { name: 'ultra', keywords: ['ultra', 'mega', 'max'] },
      {
        name: 'doble hoja',
        keywords: ['doble hoja', 'doble-hoja', 'doblehoja'],
      },
      { name: 'gigante', keywords: ['gigante', 'jumbo', 'extra'] },
      { name: 'mini', keywords: ['mini', 'pequeño', 'small'] },
      { name: 'premium', keywords: ['premium', 'de lujo', 'luxury'] },
      { name: 'eco', keywords: ['eco', 'ecológico', 'ambiental'] },
      {
        name: 'sin azúcar',
        keywords: ['sin azúcar', 'sugar free', 'sin azucar'],
      },
      {
        name: 'bajo sodio',
        keywords: ['bajo sodio', 'low sodium', 'reducido sodio'],
      },
    ];

    const getVariants = (name: string): string[] => {
      const found: string[] = [];
      const lowerName = name.toLowerCase();
      for (const variant of variants) {
        if (variant.keywords.some((keyword) => lowerName.includes(keyword))) {
          found.push(variant.name);
        }
      }
      return found;
    };

    const variants1 = getVariants(name1);
    const variants2 = getVariants(name2);

    const uniqueTo1 = variants1.filter((v) => !variants2.includes(v));
    const uniqueTo2 = variants2.filter((v) => !variants1.includes(v));

    const differences = uniqueTo1.length + uniqueTo2.length;

    if (differences === 0) {
      return 0;
    }

    // Apply a balanced penalty for each differing variant
    return differences * 0.1;
  }

  async findFlexibleDuplicateGroups(
    options: {
      threshold?: number;
      limit?: number;
      includeSimilar?: boolean;
      brand?: string;
    } = {},
  ): Promise<DuplicateGroup[]> {
    const {
      threshold = 0.7,
      limit = 50,
      includeSimilar = true,
      brand,
    } = options;
    this._logger.log(
      `🔍 Finding flexible duplicate groups with threshold: ${threshold}, limit: ${limit}`,
    );

    // Get all active base products with their store products and stores
    const queryBuilder = this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .leftJoinAndSelect('baseProduct.storeProducts', 'storeProducts')
      .leftJoinAndSelect('storeProducts.store', 'store')
      .where('baseProduct.isActive = :isActive', { isActive: true })
      .andWhere('store.status = :storeStatus', {
        storeStatus: StoreStatus.ACTIVE,
      });
    if (brand) {
      queryBuilder.andWhere('baseProduct.brand ILIKE :brand', {
        brand: `%${brand}%`,
      });
    }
    const baseProducts = await queryBuilder
      .orderBy('baseProduct.brand', 'ASC')
      .addOrderBy('baseProduct.name', 'ASC')
      .getMany();
    this._logger.log(`Found ${baseProducts.length} active base products`);

    // Calculate IDF scores for TF-IDF based similarity
    const idfScores = this._calculateIdfScores(baseProducts);

    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < baseProducts.length; i++) {
      const product = baseProducts[i];
      const productId = product.id;

      if (processed.has(productId)) continue;

      // Skip if product has no store products
      if (!product.storeProducts || product.storeProducts.length === 0) {
        this._logger.debug(`Skipping product ${product.id}: no store products`);
        continue;
      }

      const similarProducts = [product];
      processed.add(productId);

      // Find similar products - check ALL remaining products, not just from i+1
      for (let j = 0; j < baseProducts.length; j++) {
        if (i === j) continue; // Skip self
        const candidate = baseProducts[j];
        const candidateId = candidate.id;

        if (processed.has(candidateId)) continue;

        // Skip if candidate has no store products
        if (!candidate.storeProducts || candidate.storeProducts.length === 0) {
          this._logger.debug(
            `Skipping candidate ${candidate.id}: no store products`,
          );
          continue;
        }

        // Check if products are from different stores using store relationship
        const productStoreName = product.storeProducts[0]?.store?.name;
        const candidateStoreName = candidate.storeProducts[0]?.store?.name;

        if (!productStoreName || !candidateStoreName) {
          this._logger.debug(
            `Skipping comparison: missing store name in relationship`,
          );
          continue;
        }

        if (productStoreName === candidateStoreName) {
          this._logger.debug(
            `Skipping comparison: products ${product.id} and ${candidate.id} are from same store (${productStoreName})`,
          );
          continue;
        }

        // Use a more flexible similarity calculation for suggestions
        const similarity = this._calculateProductSimilarity(
          product,
          candidate,
          true,
        );

        // Debug logging for all products (only in development)
        if (this._isDevelopment) {
          const categories1: string[] =
            (product.specifications as any)?.categories || [];
          const categories2: string[] =
            (candidate.specifications as any)?.categories || [];
          this._logger.debug(
            `Comparing products: "${product.name}" vs "${
              candidate.name
            }" - Similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(
              threshold * 100
            ).toFixed(1)}%)`,
          );
          this._logger.debug(
            `Brands - Product: "${product.brand}", Candidate: "${candidate.brand}"`,
          );
          this._logger.debug(
            `Categories - Product: [${categories1.join(', ')}], Candidate: [${categories2.join(', ')}]`,
          );
        }

        if (similarity >= threshold) {
          similarProducts.push(candidate);
          processed.add(candidateId);
          this._logger.debug(
            `Added product ${candidate.id} to group with ${product.id} (similarity: ${(similarity * 100).toFixed(1)}%)`,
          );
        } else if (
          this._isDevelopment &&
          product.brand?.toLowerCase().includes('nova') &&
          candidate.brand?.toLowerCase().includes('nova')
        ) {
          this._logger.debug(
            `Nova products NOT grouped: "${product.name}" vs "${candidate.name}" - Similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
          );
        }
      }

      // Only include groups with duplicates and high similarity
      if (similarProducts.length > 1) {
        // Validate that all products in the group have high similarity with the primary product
        const validGroup = similarProducts.every((p, index) => {
          if (index === 0) return true; // Skip the primary product
          const similarity = this._calculateProductSimilarity(
            similarProducts[0],
            p,
            true,
          );
          return similarity >= threshold;
        });

        if (validGroup) {
          const group = this._createDuplicateGroup(similarProducts as BaseProductWithCounts[], idfScores);
          if (group) {
            duplicateGroups.push(group);
            this._logger.log(
              `Created duplicate group with ${similarProducts.length} products`,
            );
          }
        }
      }
    }

    // Sort by similarity and count
    duplicateGroups.sort((a, b) => {
      if (b.avgSimilarity !== a.avgSimilarity) {
        return (b.avgSimilarity ?? 0) - (a.avgSimilarity ?? 0);
      }
      return (b.count ?? 0) - (a.count ?? 0);
    });

    // Limit results
    const limitedGroups = duplicateGroups.slice(0, limit);
    this._logger.log(
      `Found ${duplicateGroups.length} duplicate groups (showing ${limitedGroups.length})`,
    );
    return limitedGroups;
  }

  /**
   * Extrae la variante principal del nombre del producto.
   */
  private _extractVariant(name: string): string | null {
    const variants = [
      'evolution',
      'clasica',
      'ultra',
      'doble hoja',
      'gigante',
      'mini',
      'premium',
      'eco',
    ];
    const lowerName = name.toLowerCase();
    for (const variant of variants) {
      if (lowerName.includes(variant)) {
        return variant;
      }
    }
    return null;
  }

  /**
   * Extrae todas las medidas (m, cm, g, kg, etc.) y cantidades (un) del nombre.
   */
  private _extractMeasurementsFromName(
    name: string,
  ): Array<{ value: number; unit: string }> {
    const measurements: Array<{ value: number; unit: string }> = [];
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(m|cm|mm|metros?|centimetros?|milimetros?)/gi,
      /(\d+(?:\.\d+)?)\s*(g|kg|gramos?|kilos?)/gi,
      /(\d+(?:\.\d+)?)\s*(l|ml|litros?|mililitros?)/gi,
      /(\d+(?:\.\d+)?)\s*(un|unidades?|pcs?|piezas?|paquetes?|c\/?u)/gi,
      /(\d+(?:\.\d+)?)\s*(m|metros?)\b/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(name)) !== null) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        // Normalizar la unidad a una forma canónica
        let normalizedUnit = unit;
        if (unit.includes('metro') || unit === 'm') normalizedUnit = 'm';
        else if (unit.includes('centimetro') || unit === 'cm')
          normalizedUnit = 'cm';
        else if (unit.includes('milimetro') || unit === 'mm')
          normalizedUnit = 'mm';
        else if (unit.includes('gramo') || unit === 'g') normalizedUnit = 'g';
        else if (unit.includes('kilo') || unit === 'kg') normalizedUnit = 'kg';
        else if (unit.includes('litro') || unit === 'l') normalizedUnit = 'l';
        else if (unit.includes('mililitro') || unit === 'ml')
          normalizedUnit = 'ml';
        else if (unit.includes('unidad') || unit === 'un' || unit.includes('c/u'))
          normalizedUnit = 'un';
        else if (unit.includes('paquete')) normalizedUnit = 'pack';

        measurements.push({ value, unit: normalizedUnit });
      }
    }
    return measurements;
  }

  /**
   * Compara dos conjuntos de medidas para ver si son significativamente diferentes.
   */
  private _areMeasurementsSignificantlyDifferent(
    m1: Array<{ value: number; unit: string }>,
    m2: Array<{ value: number; unit: string }>,
  ): boolean {
    // Si uno tiene medidas y el otro no, son diferentes.
    if (
      (m1.length === 0 && m2.length > 0) ||
      (m1.length > 0 && m2.length === 0)
    ) {
      return true;
    }

    // Comparar medidas por tipo de unidad.
    const unitsToCheck = ['m', 'g', 'l', 'un'];
    for (const unit of unitsToCheck) {
      const val1 = m1.find((m) => m.unit === unit)?.value;
      const val2 = m2.find((m) => m.unit === unit)?.value;

      if (val1 !== undefined && val2 !== undefined) {
        // Si ambas tienen la misma unidad, comparar los valores.
        const ratio = Math.max(val1, val2) / Math.min(val1, val2);
        if (ratio > 1.1) {
          // Más de un 10% de diferencia
          return true;
        }
      } else if (val1 !== undefined || val2 !== undefined) {
        // Uno tiene la medida y el otro no.
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze measurements in product names
   */
  private _analyzeMeasurements(
    name1: string,
    name2: string,
  ): {
    measurements1: Array<{ value: number; unit: string; original: string }>;
    measurements2: Array<{ value: number; unit: string; original: string }>;
    difference: 'identical' | 'minor' | 'significant' | 'none';
  } {
    const measurements1 =
      this._productSimilarityService._extractDetailedMeasurements(name1);
    const measurements2 =
      this._productSimilarityService._extractDetailedMeasurements(name2);

    if (measurements1.length === 0 && measurements2.length === 0) {
      return { measurements1, measurements2, difference: 'none' };
    }

    const grouped1 = this._groupMeasurementsByUnit(measurements1);
    const grouped2 = this._groupMeasurementsByUnit(measurements2);

    const allUnits = new Set([
      ...Object.keys(grouped1),
      ...Object.keys(grouped2),
    ]);
    let hasMinorDifference = false;

    for (const unit of allUnits) {
      const values1 = (grouped1[unit] || []).sort((a, b) => a - b);
      const values2 = (grouped2[unit] || []).sort((a, b) => a - b);

      if (values1.length === values2.length) {
        // Same number of measurements for this unit, compare values
        for (let i = 0; i < values1.length; i++) {
          const v1 = values1[i];
          const v2 = values2[i];

          if (Math.abs(v1 - v2) > 0.01) {
            // If not identical
            if (Math.abs(v1 - v2) / Math.max(v1, v2) > 0.2) {
              // More than 20% diff is significant
              return {
                measurements1,
                measurements2,
                difference: 'significant',
              };
            }
            hasMinorDifference = true;
          }
        }
      } else {
        // Different number of measurements for this unit
        // Special case for implicit '1un'
        const isImplicit1Un =
          unit === 'un' &&
          ((values1.length === 1 && values1[0] === 1 && values2.length === 0) ||
            (values2.length === 1 && values2[0] === 1 && values1.length === 0));

        if (isImplicit1Un) {
          hasMinorDifference = true;
        } else {
          return { measurements1, measurements2, difference: 'significant' };
        }
      }
    }

    return {
      measurements1,
      measurements2,
      difference: hasMinorDifference ? 'minor' : 'identical',
    };
  }

  private _groupMeasurementsByUnit(
    measurements: Array<{ value: number; unit: string }>,
  ): Record<string, number[]> {
    return measurements.reduce(
      (acc, m) => {
        if (!acc[m.unit]) {
          acc[m.unit] = [];
        }
        acc[m.unit].push(m.value);
        return acc;
      },
      {} as Record<string, number[]>,
    );
  }

  /**
   * Extract measurements from product names with detailed analysis
   */
  private _extractDetailedMeasurements(
    name: string,
  ): Array<{ value: number; unit: string; original: string }> {
    const measurements: Array<{
      value: number;
      unit: string;
      original: string;
    }> = [];

    // Common measurement patterns
    const patterns = [
      // Length patterns: 70m, 100m, 50cm, 1.5m
      /(\d+(?:\.\d+)?)\s*(m|cm|mm|metros?|centimetros?|milimetros?)\b/gi,
      // Weight patterns: 500g, 1kg, 2.5kg
      /(\d+(?:\.\d+)?)\s*(g|kg|gramos?|kilos?)\b/gi,
      // Volume patterns: 1L, 500ml, 2.5L
      /(\d+(?:\.\d+)?)\s*(l|ml|litros?|mililitros?)\b/gi,
      // Count patterns: 2un, 3un, 1un
      /(\d+(?:\.\d+)?)\s*(un|unidades?|pcs?|piezas?|paquetes?|c\/?u)\b/gi,
      // Roll patterns: 70m, 100m (for paper products)
      /(\d+(?:\.\d+)?)\s*(m|metros?)\b/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(name)) !== null) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const original = match[0];

        // Normalize units
        let normalizedUnit = unit;
        if (unit.includes('metro') || unit === 'm') normalizedUnit = 'm';
        else if (unit.includes('centimetro') || unit === 'cm')
          normalizedUnit = 'cm';
        else if (unit.includes('milimetro') || unit === 'mm')
          normalizedUnit = 'mm';
        else if (unit.includes('gramo') || unit === 'g') normalizedUnit = 'g';
        else if (unit.includes('kilo') || unit === 'kg') normalizedUnit = 'kg';
        else if (unit.includes('litro') || unit === 'l') normalizedUnit = 'l';
        else if (unit.includes('mililitro') || unit === 'ml')
          normalizedUnit = 'ml';
        else if (unit.includes('unidad') || unit === 'un' || unit.includes('c/u'))
          normalizedUnit = 'un';
        else if (unit.includes('paquete')) normalizedUnit = 'pack';

        measurements.push({
          value,
          unit: normalizedUnit,
          original,
        });
      }
    }

    return measurements;
  }

  /**
   * Convert detailed measurements to string array for compatibility
   */
  private _convertMeasurementsToStrings(
    measurements: Array<{ value: number; unit: string; original: string }>,
  ): string[] {
    return measurements.map((m) => m.original);
  }

  private _calculateWordSimilarity(name1: string, name2: string): number {
    // Split names into words and normalize
    const words1 = name1.split(/\s+/).filter((word) => word.length > 2);
    const words2 = name2.split(/\s+/).filter((word) => word.length > 2);

    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate word overlap (order independent) - more generous matching
    const commonWords = words1.filter((word1) =>
      words2.some(
        (word2) =>
          this._productSimilarityService.calculateSimilarity(
            word1,
            null,
            word2,
            null,
          ) > 0.7,
      ),
    );

    const totalWords = Math.max(words1.length, words2.length);
    const wordOverlap = commonWords.length / totalWords;

    // If all words match (regardless of order), return very high similarity
    if (wordOverlap === 1.0) {
      return 0.95; // 95% for perfect word match
    }

    // Calculate word order similarity
    const orderSimilarity = this._calculateWordOrderSimilarity(words1, words2);

    // If most words match, boost the similarity significantly
    if (wordOverlap >= 0.8) {
      return Math.min(0.9, wordOverlap + 0.1); // Boost high word overlap
    }

    // Weighted combination: 80% word overlap, 20% order similarity
    return wordOverlap * 0.8 + orderSimilarity * 0.2;
  }

  private _calculateWordOrderSimilarity(
    words1: string[],
    words2: string[],
  ): number {
    if (words1.length !== words2.length) return 0;

    let matches = 0;
    for (let i = 0; i < words1.length; i++) {
      if (
        this._productSimilarityService.calculateSimilarity(
          words1[i],
          null,
          words2[i],
          null,
        ) > 0.8
      ) {
        matches++;
      }
    }

    return matches / words1.length;
  }

  private _calculateBrandSimilarity(
    brand1: string | null,
    brand2: string | null,
  ): number {
    if (!brand1 && !brand2) return 1;
    if (!brand1 || !brand2) return 0;

    const normalized1 = this._productNormalizationService.normalizeBrand(
      brand1 || '',
    );
    const normalized2 = this._productNormalizationService.normalizeBrand(
      brand2 || '',
    );

    // If brands are exactly the same after normalization
    if (normalized1 === normalized2) return 1.0;

    // If brands are completely different (no common characters), very low similarity
    const commonChars = this._countCommonCharacters(normalized1, normalized2);
    const minLength = Math.min(normalized1.length, normalized2.length);
    if (minLength > 0 && commonChars / minLength < 0.5) {
      return 0.05; // Very low similarity for completely different brands
    }

    // Calculate string similarity but be more strict
    const similarity = this._productSimilarityService.calculateSimilarity(
      normalized1,
      null,
      normalized2,
      null,
    );

    // Only consider brands similar if they have very high similarity (90%+)
    if (similarity < 0.9) {
      return 0.05; // Very low similarity for different brands
    }

    return similarity;
  }

  private _countCommonCharacters(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase());
    const set2 = new Set(str2.toLowerCase());
    let common = 0;

    for (const char of set1) {
      if (set2.has(char)) {
        common++;
      }
    }

    return common;
  }

  private _calculateCategorySimilarity(specs1: any, specs2: any): number {
    if (!specs1 || !specs2) return 0.5; // Neutral if no category info

    const categories1 = specs1.categories || [];
    const categories2 = specs2.categories || [];

    if (categories1.length === 0 && categories2.length === 0) return 0.5; // Neutral if no categories

    // Normalize categories to lowercase for comparison
    const normalized1 = categories1.map((cat: string) =>
      cat.toLowerCase().trim(),
    );
    const normalized2 = categories2.map((cat: string) =>
      cat.toLowerCase().trim(),
    );

    // Check for exact matches
    const exactMatches = normalized1.filter((cat1) =>
      normalized2.includes(cat1),
    );
    if (exactMatches.length > 0) {
      return 1.0; // Perfect match if any category is identical
    }

    // Check for similar categories using keyword matching
    const similarCategories = this._findSimilarCategories(
      normalized1,
      normalized2,
    );
    if (similarCategories.length > 0) {
      return 0.8; // High similarity for similar categories
    }

    // Check for partial matches (one category contains another)
    const partialMatches = this._findPartialCategoryMatches(
      normalized1,
      normalized2,
    );
    if (partialMatches.length > 0) {
      return 0.6; // Medium similarity for partial matches
    }

    // No matches found
    return 0.2; // Low similarity for completely different categories
  }

  private _findSimilarCategories(
    categories1: string[],
    categories2: string[],
  ): string[] {
    const similarGroups = [
      ['toallas de papel', 'papel higiénico', 'toilet paper', 'tissue'],
      ['pañuelos', 'pañuelos faciales', 'facial tissues', 'kleenex'],
      ['paños', 'paños de limpieza', 'cleaning cloths', 'reutilizables'],
      ['azúcar', 'azucar', 'sugar', 'endulzante', 'sweetener'],
      ['aceite', 'oil', 'aceite de cocina', 'cooking oil'],
      ['harina', 'flour', 'harina de trigo', 'wheat flour'],
      ['arroz', 'rice', 'arroz blanco', 'white rice'],
      ['pasta', 'fideos', 'noodles', 'spaghetti'],
      ['sal', 'salt', 'sal marina', 'sea salt'],
      ['especias', 'spices', 'condimentos', 'seasoning'],
    ];

    const matches: string[] = [];

    for (const group of similarGroups) {
      const hasCategory1 = categories1.some((cat1) =>
        group.some((keyword) => cat1.includes(keyword)),
      );
      const hasCategory2 = categories2.some((cat2) =>
        group.some((keyword) => cat2.includes(keyword)),
      );

      if (hasCategory1 && hasCategory2) {
        matches.push(group[0]); // Use first keyword as representative
      }
    }

    return matches;
  }

  private _findPartialCategoryMatches(
    categories1: string[],
    categories2: string[],
  ): string[] {
    const matches: string[] = [];

    for (const cat1 of categories1) {
      for (const cat2 of categories2) {
        // Check if one category contains the other
        if (cat1.includes(cat2) || cat2.includes(cat1)) {
          matches.push(cat1);
        }
      }
    }

    return matches;
  }

  private _calculateProductTypeSimilarity(
    name1: string,
    name2: string,
  ): number {
    // Extract product types from names
    const type1 = this._extractProductType(name1);
    const type2 = this._extractProductType(name2);

    if (type1 === type2) return 1;
    if (this._areProductTypesSimilar(type1, type2)) return 0.8;

    return 0;
  }

  private _extractProductType(name: string): string {
    const lowerName = name.toLowerCase();

    // Define product type categories
    if (
      lowerName.includes('alcohol') ||
      lowerName.includes('isopropílico') ||
      lowerName.includes('desinfectante')
    ) {
      return 'alcohol_wipes';
    }
    if (lowerName.includes('papel') && lowerName.includes('toalla')) {
      return 'paper_towel';
    }
    if (lowerName.includes('toalla') && !lowerName.includes('papel')) {
      return 'towel';
    }
    if (lowerName.includes('servilleta')) {
      return 'napkin';
    }
    if (lowerName.includes('pañal')) {
      return 'diaper';
    }
    if (lowerName.includes('pañito') || lowerName.includes('toallita')) {
      return 'wipes';
    }
    if (lowerName.includes('detergente') || lowerName.includes('jabón')) {
      return 'cleaning_product';
    }
    if (lowerName.includes('shampoo') || lowerName.includes('champú')) {
      return 'shampoo';
    }
    if (lowerName.includes('crema') || lowerName.includes('loción')) {
      return 'cream';
    }
    if (lowerName.includes('arroz')) {
      return 'rice';
    }
    if (lowerName.includes('lentejas')) {
      return 'lentils';
    }
    if (lowerName.includes('pasta')) {
      return 'pasta';
    }
    if (lowerName.includes('fideos')) {
      return 'noodles';
    }
    if (lowerName.includes('harina')) {
      return 'flour';
    }
    if (lowerName.includes('azúcar')) {
      return 'sugar';
    }
    if (lowerName.includes('aceite')) {
      return 'oil';
    }
    if (lowerName.includes('leche')) {
      return 'milk';
    }
    if (lowerName.includes('pan')) {
      return 'bread';
    }
    if (lowerName.includes('queso')) {
      return 'cheese';
    }
    if (lowerName.includes('carne')) {
      return 'meat';
    }
    if (lowerName.includes('pollo')) {
      return 'chicken';
    }
    if (lowerName.includes('pescado')) {
      return 'fish';
    }
    if (lowerName.includes('fruta')) {
      return 'fruit';
    }
    if (lowerName.includes('verdura')) {
      return 'vegetable';
    }
    if (lowerName.includes('cereal')) {
      return 'cereal';
    }
    if (lowerName.includes('galleta')) {
      return 'cookie';
    }
    if (lowerName.includes('chocolate')) {
      return 'chocolate';
    }
    if (lowerName.includes('bebida')) {
      return 'beverage';
    }
    if (lowerName.includes('agua')) {
      return 'water';
    }
    if (lowerName.includes('jugo')) {
      return 'juice';
    }
    if (lowerName.includes('café')) {
      return 'coffee';
    }
    if (lowerName.includes('té')) {
      return 'tea';
    }
    if (lowerName.includes('yogurt')) {
      return 'yogurt';
    }
    if (lowerName.includes('huevo')) {
      return 'egg';
    }
    if (lowerName.includes('mantequilla')) {
      return 'butter';
    }
    if (lowerName.includes('margarina')) {
      return 'margarine';
    }
    if (lowerName.includes('sal')) {
      return 'salt';
    }
    if (lowerName.includes('pimienta')) {
      return 'pepper';
    }
    if (lowerName.includes('especia')) {
      return 'spice';
    }
    if (lowerName.includes('condimento')) {
      return 'condiment';
    }
    if (lowerName.includes('salsa')) {
      return 'sauce';
    }
    if (lowerName.includes('vinagre')) {
      return 'vinegar';
    }
    if (lowerName.includes('mostaza')) {
      return 'mustard';
    }
    if (lowerName.includes('mayonesa')) {
      return 'mayonnaise';
    }
    if (lowerName.includes('ketchup')) {
      return 'ketchup';
    }
    if (lowerName.includes('mermelada')) {
      return 'jam';
    }
    if (lowerName.includes('miel')) {
      return 'honey';
    }
    if (lowerName.includes('dulce')) {
      return 'sweet';
    }
    if (lowerName.includes('goma')) {
      return 'gum';
    }
    if (lowerName.includes('caramelo')) {
      return 'candy';
    }
    if (lowerName.includes('helado')) {
      return 'ice_cream';
    }
    if (lowerName.includes('congelado')) {
      return 'frozen';
    }
    if (lowerName.includes('conserva')) {
      return 'canned';
    }
    if (lowerName.includes('enlatado')) {
      return 'canned';
    }
    if (lowerName.includes('deshidratado')) {
      return 'dehydrated';
    }
    if (lowerName.includes('instantáneo')) {
      return 'instant';
    }
    if (lowerName.includes('preparado')) {
      return 'prepared';
    }
    if (lowerName.includes('cocido')) {
      return 'cooked';
    }
    if (lowerName.includes('crudo')) {
      return 'raw';
    }
    if (lowerName.includes('fresco')) {
      return 'fresh';
    }
    if (lowerName.includes('seco')) {
      return 'dry';
    }
    if (lowerName.includes('húmedo')) {
      return 'wet';
    }
    if (lowerName.includes('líquido')) {
      return 'liquid';
    }
    if (lowerName.includes('sólido')) {
      return 'solid';
    }
    if (lowerName.includes('polvo')) {
      return 'powder';
    }
    if (lowerName.includes('granulado')) {
      return 'granulated';
    }
    if (lowerName.includes('molido')) {
      return 'ground';
    }
    if (lowerName.includes('entero')) {
      return 'whole';
    }
    if (lowerName.includes('partido')) {
      return 'broken';
    }
    if (lowerName.includes('triturado')) {
      return 'crushed';
    }
    if (lowerName.includes('picado')) {
      return 'chopped';
    }
    if (lowerName.includes('cortado')) {
      return 'cut';
    }
    if (lowerName.includes('rebanado')) {
      return 'sliced';
    }
    if (lowerName.includes('rallado')) {
      return 'grated';
    }
    if (lowerName.includes('pelado')) {
      return 'peeled';
    }
    if (lowerName.includes('sin pelar')) {
      return 'unpeeled';
    }
    if (lowerName.includes('con cáscara')) {
      return 'with_skin';
    }
    if (lowerName.includes('sin cáscara')) {
      return 'without_skin';
    }
    if (lowerName.includes('con semilla')) {
      return 'with_seed';
    }
    if (lowerName.includes('sin semilla')) {
      return 'without_seed';
    }
    if (lowerName.includes('con hueso')) {
      return 'with_bone';
    }
    if (lowerName.includes('sin hueso')) {
      return 'without_bone';
    }
    if (lowerName.includes('con grasa')) {
      return 'with_fat';
    }
    if (lowerName.includes('sin grasa')) {
      return 'without_fat';
    }
    if (lowerName.includes('con azúcar')) {
      return 'with_sugar';
    }
    if (lowerName.includes('sin azúcar')) {
      return 'without_sugar';
    }
    if (lowerName.includes('con sal')) {
      return 'with_salt';
    }
    if (lowerName.includes('sin sal')) {
      return 'without_salt';
    }
    if (lowerName.includes('con conservantes')) {
      return 'with_preservatives';
    }
    if (lowerName.includes('sin conservantes')) {
      return 'without_preservatives';
    }
    if (lowerName.includes('orgánico')) {
      return 'organic';
    }
    if (lowerName.includes('natural')) {
      return 'natural';
    }
    if (lowerName.includes('artificial')) {
      return 'artificial';
    }
    if (lowerName.includes('sintético')) {
      return 'synthetic';
    }
    if (lowerName.includes('biológico')) {
      return 'biological';
    }
    if (lowerName.includes('ecológico')) {
      return 'ecological';
    }
    if (lowerName.includes('sostenible')) {
      return 'sustainable';
    }
    if (lowerName.includes('local')) {
      return 'local';
    }
    if (lowerName.includes('importado')) {
      return 'imported';
    }
    if (lowerName.includes('nacional')) {
      return 'national';
    }
    if (lowerName.includes('internacional')) {
      return 'international';
    }
    if (lowerName.includes('tradicional')) {
      return 'traditional';
    }
    if (lowerName.includes('moderno')) {
      return 'modern';
    }
    if (lowerName.includes('clásico')) {
      return 'classic';
    }
    if (lowerName.includes('nuevo')) {
      return 'new';
    }
    if (lowerName.includes('viejo')) {
      return 'old';
    }
    if (lowerName.includes('joven')) {
      return 'young';
    }
    if (lowerName.includes('maduro')) {
      return 'mature';
    }
    if (lowerName.includes('verde')) {
      return 'green';
    }
    if (lowerName.includes('rojo')) {
      return 'red';
    }
    if (lowerName.includes('azul')) {
      return 'blue';
    }
    if (lowerName.includes('amarillo')) {
      return 'yellow';
    }
    if (lowerName.includes('blanco')) {
      return 'white';
    }
    if (lowerName.includes('negro')) {
      return 'black';
    }
    if (lowerName.includes('marrón')) {
      return 'brown';
    }
    if (lowerName.includes('gris')) {
      return 'grey';
    }
    if (lowerName.includes('rosa')) {
      return 'pink';
    }
    if (lowerName.includes('naranja')) {
      return 'orange';
    }
    if (lowerName.includes('morado')) {
      return 'purple';
    }
    if (lowerName.includes('dorado')) {
      return 'golden';
    }
    if (lowerName.includes('plateado')) {
      return 'silver';
    }
    if (lowerName.includes('transparente')) {
      return 'transparent';
    }
    if (lowerName.includes('opaco')) {
      return 'opaque';
    }
    if (lowerName.includes('brillante')) {
      return 'shiny';
    }
    if (lowerName.includes('mate')) {
      return 'matte';
    }
    if (lowerName.includes('suave')) {
      return 'soft';
    }
    if (lowerName.includes('duro')) {
      return 'hard';
    }
    if (lowerName.includes('blando')) {
      return 'soft';
    }
    if (lowerName.includes('firme')) {
      return 'firm';
    }
    if (lowerName.includes('flexible')) {
      return 'flexible';
    }
    if (lowerName.includes('rígido')) {
      return 'rigid';
    }
    if (lowerName.includes('elástico')) {
      return 'elastic';
    }
    if (lowerName.includes('plástico')) {
      return 'plastic';
    }
    if (lowerName.includes('metal')) {
      return 'metal';
    }
    if (lowerName.includes('madera')) {
      return 'wood';
    }
    if (lowerName.includes('vidrio')) {
      return 'glass';
    }
    if (lowerName.includes('cerámica')) {
      return 'ceramic';
    }
    if (lowerName.includes('porcelana')) {
      return 'porcelain';
    }
    if (lowerName.includes('cristal')) {
      return 'crystal';
    }
    if (lowerName.includes('piedra')) {
      return 'stone';
    }
    if (lowerName.includes('mármol')) {
      return 'marble';
    }
    if (lowerName.includes('granito')) {
      return 'granite';
    }
    if (lowerName.includes('cuarzo')) {
      return 'quartz';
    }
    if (lowerName.includes('diamante')) {
      return 'diamond';
    }
    if (lowerName.includes('oro')) {
      return 'gold';
    }
    if (lowerName.includes('plata')) {
      return 'silver';
    }
    if (lowerName.includes('cobre')) {
      return 'copper';
    }
    if (lowerName.includes('hierro')) {
      return 'iron';
    }
    if (lowerName.includes('acero')) {
      return 'steel';
    }
    if (lowerName.includes('aluminio')) {
      return 'aluminum';
    }
    if (lowerName.includes('zinc')) {
      return 'zinc';
    }
    if (lowerName.includes('estaño')) {
      return 'tin';
    }
    if (lowerName.includes('plomo')) {
      return 'lead';
    }
    if (lowerName.includes('mercurio')) {
      return 'mercury';
    }
    if (lowerName.includes('cromo')) {
      return 'chrome';
    }
    if (lowerName.includes('níquel')) {
      return 'nickel';
    }
    if (lowerName.includes('titanio')) {
      return 'titanium';
    }
    if (lowerName.includes('tungsteno')) {
      return 'tungsten';
    }
    if (lowerName.includes('uranio')) {
      return 'uranium';
    }
    if (lowerName.includes('plutonio')) {
      return 'plutonium';
    }
    if (lowerName.includes('radio')) {
      return 'radium';
    }
    if (lowerName.includes('cesio')) {
      return 'cesium';
    }
    if (lowerName.includes('rubidio')) {
      return 'rubidium';
    }
    if (lowerName.includes('potasio')) {
      return 'potassium';
    }
    if (lowerName.includes('sodio')) {
      return 'sodium';
    }
    if (lowerName.includes('litio')) {
      return 'lithium';
    }
    if (lowerName.includes('berilio')) {
      return 'beryllium';
    }
    if (lowerName.includes('magnesio')) {
      return 'magnesium';
    }
    if (lowerName.includes('calcio')) {
      return 'calcium';
    }
    if (lowerName.includes('estroncio')) {
      return 'strontium';
    }
    if (lowerName.includes('bario')) {
      return 'barium';
    }
    if (lowerName.includes('radio')) {
      return 'radium';
    }
    if (lowerName.includes('francio')) {
      return 'francium';
    }
    if (lowerName.includes('actinio')) {
      return 'actinium';
    }
    if (lowerName.includes('torio')) {
      return 'thorium';
    }
    if (lowerName.includes('protactinio')) {
      return 'protactinium';
    }
    if (lowerName.includes('neptunio')) {
      return 'neptunium';
    }
    if (lowerName.includes('americio')) {
      return 'americium';
    }
    if (lowerName.includes('curio')) {
      return 'curium';
    }
    if (lowerName.includes('berkelio')) {
      return 'berkelium';
    }
    if (lowerName.includes('californio')) {
      return 'californium';
    }
    if (lowerName.includes('einsteinio')) {
      return 'einsteinium';
    }
    if (lowerName.includes('fermio')) {
      return 'fermium';
    }
    if (lowerName.includes('mendelevio')) {
      return 'mendelevium';
    }
    if (lowerName.includes('nobelio')) {
      return 'nobelium';
    }
    if (lowerName.includes('laurencio')) {
      return 'lawrencium';
    }
    if (lowerName.includes('rutherfordio')) {
      return 'rutherfordium';
    }
    if (lowerName.includes('dubnio')) {
      return 'dubnium';
    }
    if (lowerName.includes('seaborgio')) {
      return 'seaborgium';
    }
    if (lowerName.includes('bohrio')) {
      return 'bohrium';
    }
    if (lowerName.includes('hasio')) {
      return 'hassium';
    }
    if (lowerName.includes('meitnerio')) {
      return 'meitnerium';
    }
    if (lowerName.includes('darmstadtio')) {
      return 'darmstadtium';
    }
    if (lowerName.includes('roentgenio')) {
      return 'roentgenium';
    }
    if (lowerName.includes('copernicio')) {
      return 'copernicium';
    }
    if (lowerName.includes('nihonio')) {
      return 'nihonium';
    }
    if (lowerName.includes('flerovio')) {
      return 'flerovium';
    }
    if (lowerName.includes('moscovio')) {
      return 'moscovium';
    }
    if (lowerName.includes('livermorio')) {
      return 'livermorium';
    }
    if (lowerName.includes('tennessino')) {
      return 'tennessine';
    }
    if (lowerName.includes('oganessón')) {
      return 'oganesson';
    }

    return 'other';
  }

  private _areProductTypesSimilar(type1: string, type2: string): boolean {
    // Define similar product types
    const similarTypes = [
      ['paper_towel', 'towel'],
      ['wipes', 'alcohol_wipes'],
      ['napkin', 'paper_towel'],
      ['cream', 'lotion'],
    ];

    for (const group of similarTypes) {
      if (group.includes(type1) && group.includes(type2)) {
        return true;
      }
    }

    return false;
  }

  private _calculateMeasurementsSimilarity(
    name1: string,
    name2: string,
  ): number {
    const measurements1 =
      this._productSimilarityService._extractDetailedMeasurements(name1);
    const measurements2 =
      this._productSimilarityService._extractDetailedMeasurements(name2);

    if (measurements1.length === 0 && measurements2.length === 0) return 1;
    if (measurements1.length === 0 || measurements2.length === 0) return 0.5;

    // Check if measurements are similar
    const similarCount = measurements1.filter((m1) =>
      measurements2.some((m2) =>
        this._productSimilarityService._areMeasurementsSimilar(
          m1.original,
          m2.original,
        ),
      ),
    ).length;

    return similarCount / Math.max(measurements1.length, measurements2.length);
  }

  private _calculateWordOverlapSimilarity(
    words1: string[],
    words2: string[],
  ): number {
    if (words1.length === 0 && words2.length === 0) return 1.0;
    if (words1.length === 0 || words2.length === 0) return 0.0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter((word) => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    const jaccardSimilarity = intersection.size / union.size;

    // Also check for partial word matches (e.g., "gigante" vs "gigantes")
    let partialMatches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 !== word2) {
          // Check if one word contains the other (for plurals, etc.)
          if (word1.includes(word2) || word2.includes(word1)) {
            partialMatches++;
            break;
          }
        }
      }
    }

    // Combine Jaccard similarity with partial matches
    const partialSimilarity =
      partialMatches / Math.max(words1.length, words2.length);

    return Math.max(jaccardSimilarity, partialSimilarity);
  }

  private _calculateJaroWinklerSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro =
      (matches / str1.length +
        matches / str2.length +
        (matches - transpositions / 2) / matches) /
      3;

    // Winkler modification
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + 0.1 * prefix * (1 - jaro);
  }

  private _createDuplicateGroup(
    products: BaseProductWithCounts[],
    idfScores: Map<string, number>,
  ): DuplicateGroup | null {
    if (products.length < 2) {
      return null;
    }

    const brand = products[0].brand || 'Sin marca';

    // Calculate group statistics
    const totalStores = new Set(
      products.flatMap(
        (p) =>
          p.storeProducts
            ?.map((sp: StoreProduct) => sp.storeId)
            .filter(Boolean) || [],
      ),
    ).size;

    const totalVariants = products.reduce(
      (sum, p) => sum + (p.totalVariants || 0),
      0,
    );

    // Calculate the average similarity of the group using TF-IDF
    let totalSimilarity = 0;
    let comparisons = 0;
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        totalSimilarity += this._calculateTfidfSimilarity(
          products[i],
          products[j],
          idfScores,
        );
        comparisons++;
      }
    }
    const avgSimilarity =
      comparisons > 0 ? totalSimilarity / comparisons : 1.0;

    const firstStoreProduct = products[0].storeProducts?.[0];
    const productImage =
      firstStoreProduct?.image ||
      products[0].image ||
      'https://via.placeholder.com/150';

    const group: DuplicateGroup = {
      id: `group_${products[0].id}`,
      avgSimilarity: parseFloat(avgSimilarity.toFixed(2)),
      count: products.length,
      brand,
      image: productImage,
      totalStores,
      totalVariants,
      products: products.map((p) => {
        const firstStoreProduct = p.storeProducts?.[0];
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          image: p.image || firstStoreProduct?.image || productImage,
          url: firstStoreProduct?.url || null,
          storeName: firstStoreProduct?.store?.name,
          storeCount: p.storeProducts?.length || 0,
          variants: p.totalVariants || 0,
          createdAt: p.createdAt,
        };
      }),
    };

    return group;
  }

  private _filterProductsFromDifferentStores(
    products: BaseProduct[],
  ): BaseProduct[] {
    const filteredProducts: BaseProduct[] = [];
    const usedStores = new Set<string>();

    for (const product of products) {
      const productStores =
        product.storeProducts
          ?.map((sp: StoreProduct) => sp.storeId)
          .filter(Boolean) || [];

      // Check if this product has any stores that haven't been used yet
      const hasUnusedStores = productStores.some(
        (storeId: string) => !usedStores.has(storeId),
      );

      if (hasUnusedStores) {
        filteredProducts.push(product);
        // Mark all stores from this product as used
        productStores.forEach((storeId: string) => usedStores.add(storeId));
      }
    }

    return filteredProducts;
  }

  private _suggestMergeData(products: BaseProduct[]): any {
    // Use the product with most stores as primary
    const primaryProduct = products.reduce((prev, current) =>
      (current.storeCount || 0) > (prev.storeCount || 0) ? current : prev,
    );

    // Combine specifications
    const combinedSpecs = products.reduce((acc, product) => {
      if (product.specifications) {
        Object.assign(acc, product.specifications);
      }
      return acc;
    }, {});

    return {
      name: primaryProduct.name,
      brand: primaryProduct.brand,
      model: primaryProduct.model,
      sku: primaryProduct.sku,
      specifications: combinedSpecs,
    };
  }

  private _getMergeRecommendation(
    products: BaseProduct[],
    confidence: string,
  ): string {
    if (confidence === 'high') {
      return 'Highly recommended to merge - products are very similar';
    } else if (confidence === 'medium') {
      return 'Consider merging - products are similar but review carefully';
    } else {
      return 'Review manually - similarity is low, may not be duplicates';
    }
  }

  async mergeProducts(
    baseProductId: string,
    duplicateProductIds: string[],
  ): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId, isActive: true },
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Update store products to point to the main product
    for (const duplicateId of duplicateProductIds) {
      await this._storeProductRepository.update(
        { baseProductId: duplicateId },
        { baseProductId: baseProductId },
      );

      // Mark duplicate as inactive
      await this._baseProductRepository.update(duplicateId, {
        isActive: false,
      });
    }

    // Update counts for the main product
    await this.updateProductCounts(baseProductId);

    return {
      message: 'Products merged successfully',
      baseProductId,
      mergedCount: duplicateProductIds.length,
    };
  }

  async associateStoreProduct(
    storeProductId: string,
    baseProductId: string,
  ): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId },
    });

    if (!storeProduct) {
      throw new Error('Store product not found');
    }

    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId, isActive: true },
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Check if store product is already associated
    if (storeProduct.baseProductId) {
      throw new Error(
        'Store product is already associated with a base product',
      );
    }

    // Update the store product to point to the base product
    await this._storeProductRepository.update(storeProductId, {
      baseProductId: baseProductId,
    });

    // Update counts for the base product
    await this.updateProductCounts(baseProductId);

    this._logger.log(
      `✅ Store product "${storeProduct.name}" associated with base product "${baseProduct.name}"`,
    );

    return {
      message: 'Store product associated successfully',
      storeProductId,
      baseProductId,
      storeProduct: {
        id: storeProduct.id,
        name: storeProduct.name,
        storeId: storeProduct.storeId,
      },
      baseProduct: {
        id: baseProduct.id,
        name: baseProduct.name,
        brand: baseProduct.brand,
      },
    };
  }

  async disassociateStoreProduct(storeProductId: string): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId },
    });

    if (!storeProduct) {
      throw new Error('Store product not found');
    }

    if (!storeProduct.baseProductId) {
      throw new Error('Store product is not associated with any base product');
    }

    const baseProductId = storeProduct.baseProductId;

    // Remove association
    await this._storeProductRepository.update(storeProductId, {
      baseProductId: null,
    });

    // Update counts for the base product
    await this.updateProductCounts(baseProductId);

    this._logger.log(
      `✅ Store product "${storeProduct.name}" disassociated from base product`,
    );

    return {
      message: 'Store product disassociated successfully',
      storeProductId,
      baseProductId,
    };
  }

  async deleteBaseProduct(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id },
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Count associated store products before disassociating
    const associatedCount = await this._storeProductRepository.count({
      where: { baseProductId: id },
    });

    // Disassociate all store products when deactivating base product
    if (associatedCount > 0) {
      await this._storeProductRepository.update(
        { baseProductId: id },
        { baseProductId: null },
      );

      this._logger.log(
        `✅ Disassociated ${associatedCount} store products from base product "${baseProduct.name}"`,
      );
    }

    // Soft delete - mark as inactive
    await this._baseProductRepository.update(id, { isActive: false });

    this._logger.log(
      `✅ Base product "${baseProduct.name}" deactivated and ${associatedCount} store products disassociated`,
    );

    return {
      message:
        'Base product deactivated successfully and all store products disassociated',
      baseProductId: id,
      disassociatedStoreProducts: associatedCount,
      isActive: false,
    };
  }

  async getBaseProducts(options: {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
    isActive?: boolean;
  }): Promise<any> {
    const { page = 1, limit = 10, search, brand, isActive } = options;

    const queryBuilder =
      this._baseProductRepository.createQueryBuilder('baseProduct');

    if (search) {
      const normalizedSearch =
        this._productNormalizationService.normalizeProductName(search);
      queryBuilder.andWhere(
        '(baseProduct.name ILIKE :search OR baseProduct.brand ILIKE :search OR baseProduct.model ILIKE :search)',
        { search: `%${normalizedSearch}%` },
      );
    }

    if (brand) {
      queryBuilder.andWhere('baseProduct.brand ILIKE :brand', {
        brand: `%${brand}%`,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('baseProduct.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    const products = await queryBuilder
      .orderBy('baseProduct.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateBaseProduct(
    id: string,
    updateData: Partial<BaseProduct>,
  ): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id },
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    await this._baseProductRepository.update(id, updateData);

    // Update counts if needed
    if (updateData.isActive !== undefined) {
      await this.updateProductCounts(id);
    }

    return {
      message: 'Base product updated successfully',
      id,
    };
  }

  async suggestAssociations(
    storeProductId: string,
    threshold: number = 0.7,
  ): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId },
      relations: ['store'],
    });

    if (!storeProduct) {
      throw new Error('Store product not found');
    }

    const normalizedName =
      this._productNormalizationService.normalizeProductName(storeProduct.name);
    const normalizedBrand = this._productNormalizationService.normalizeBrand(
      storeProduct.metadata?.brand || '',
    );

    // Find similar base products
    const baseProducts = await this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .where('baseProduct.isActive = :isActive', { isActive: true })
      .andWhere('baseProduct.brand ILIKE :brand', {
        brand: `%${normalizedBrand}%`,
      })
      .getMany();

    const suggestions: Array<{
      baseProduct: BaseProduct;
      similarity: number;
      matchReason: string;
    }> = [];
    for (const baseProduct of baseProducts) {
      const similarity = this._productSimilarityService.calculateSimilarity(
        normalizedName,
        normalizedBrand,
        baseProduct.name,
        baseProduct.brand,
      );

      if (similarity >= threshold) {
        suggestions.push({
          baseProduct,
          similarity,
          matchReason: this._getMatchReason(
            storeProduct.name,
            baseProduct.name,
          ),
        });
      }
    }

    return {
      storeProduct,
      suggestions: suggestions.sort((a, b) => b.similarity - a.similarity),
    };
  }

  async getBaseProductById(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id },
      relations: [
        'storeProducts',
        'storeProducts.store',
        'storeProducts.creator',
      ],
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    return baseProduct;
  }

  async createBaseProduct(createData: {
    name: string;
    brand?: string;
    model?: string;
    sku?: string;
    specifications?: Record<string, any>;
    isActive?: boolean;
  }): Promise<any> {
    const baseProduct = this._baseProductRepository.create({
      name: createData.name,
      brand: createData.brand,
      model: createData.model,
      sku: createData.sku,
      specifications: createData.specifications || {},
      isActive: createData.isActive !== undefined ? createData.isActive : true,
      storeCount: 0,
      totalVariants: 0,
    });

    const savedBaseProduct =
      await this._baseProductRepository.save(baseProduct);

    this._logger.log(
      `✅ Created base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`,
    );

    return savedBaseProduct;
  }

  async hardDeleteBaseProduct(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id },
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Disassociate all store products
    const disassociatedCount = await this._storeProductRepository.update(
      { baseProductId: id },
      { baseProductId: null },
    );

    // Hard delete the base product
    await this._baseProductRepository.remove(baseProduct);

    this._logger.log(
      `✅ Base product "${baseProduct.name}" hard deleted and ${disassociatedCount.affected} store products disassociated`,
    );

    return {
      message: 'Base product hard deleted successfully',
      baseProductId: id,
      disassociatedStoreProducts: disassociatedCount.affected || 0,
    };
  }

  private _extractProductKey(name: string, brand: string): string {
    const normalized =
      this._productNormalizationService.normalizeProductName(name);
    const brandNormalized = (brand || '').toLowerCase().trim();

    // Extract measurements
    const measurements =
      normalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];
    const measurementsStr = measurements.sort().join(' ');

    // Extract product type
    const productType = normalized
      .replace(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g, '')
      .replace(
        /\b(toalla|papel|de|del|en|con|para|por|sin|sobre|bajo|entre|hasta|desde|durante|mediante|según|tras|ante|contra)\b/g,
        ' ',
      )
      .replace(/\s+/g, ' ')
      .trim();

    return `${brandNormalized}|${productType}|${measurementsStr}`;
  }

  private _getMatchReason(
    storeProductName: string,
    baseProductName: string,
  ): string {
    const storeNormalized =
      this._productNormalizationService.normalizeProductName(storeProductName);
    const baseNormalized =
      this._productNormalizationService.normalizeProductName(baseProductName);

    if (storeNormalized === baseNormalized) {
      return 'Exact match';
    }

    const storeMeasurements: string[] =
      storeNormalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];
    const baseMeasurements: string[] =
      baseNormalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];

    if (storeMeasurements.length > 0 && baseMeasurements.length > 0) {
      const commonMeasurements = storeMeasurements.filter((m: string) =>
        baseMeasurements.includes(m),
      );
      if (commonMeasurements.length > 0) {
        return `Similar measurements: ${commonMeasurements.join(', ')}`;
      }
    }

    return 'Similar product name';
  }
}
