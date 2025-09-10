import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { BaseProduct } from '../entities/base-product.entity';
import { StoreProduct } from '../entities/store-product.entity';

@Injectable()
export class ProductMatchingService {
  private readonly _logger = new Logger(ProductMatchingService.name);

  constructor(
    @InjectRepository(BaseProduct)
    private readonly _baseProductRepository: Repository<BaseProduct>,
    @InjectRepository(StoreProduct)
    private readonly _storeProductRepository: Repository<StoreProduct>,
  ) {}

  async findOrCreateMatchingBaseProduct(
    productName: string,
    brand?: string,
    specifications?: Record<string, any>,
    storeId?: string,
  ): Promise<BaseProduct> {
    try {
      const normalizedName = this._normalizeProductName(productName);
      const normalizedBrand = brand ? this._normalizeBrand(brand) : null;

      this._logger.log(`Creating individual base product for: "${productName}" (brand: "${brand}")`);

      // NO AUTOMATIC MATCHING - Each store product gets its own base product
      // This ensures 1:1 relationship between store products and base products
      // Admin will manually associate them later if needed

      // Create new base product for this specific store product
      this._logger.log(`Creating individual base product for: "${productName}"`);
      
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

      const savedBaseProduct = await this._baseProductRepository.save(newBaseProduct) as BaseProduct;
      this._logger.log(`✅ Created individual base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`);
      
      return savedBaseProduct;
    } catch (error) {
      this._logger.error(`Error in findOrCreateMatchingBaseProduct for "${productName}":`, error);
      
      // Fallback: create a simple base product without matching
      const fallbackProduct = this._baseProductRepository.create({
        name: productName,
        brand: brand || undefined,
        specifications: specifications || {},
        isActive: true,
        storeCount: 0,
        totalVariants: 0,
      });

      return await this._baseProductRepository.save(fallbackProduct) as BaseProduct;
    }
  }

  async getProductComparison(baseProductId: string): Promise<{
    baseProduct: BaseProduct;
    storeProducts: StoreProduct[];
    priceRange: { min: number; max: number; avg: number };
    stores: Array<{ store: any; product: StoreProduct; price: number }>;
  }> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId },
      relations: ['storeProducts', 'storeProducts.store', 'storeProducts.categories'],
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    const storeProducts = baseProduct.storeProducts.filter(sp => sp.price && sp.price > 0);
    const prices = storeProducts.map(sp => sp.price).filter(p => p > 0);

    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    };

    const stores = storeProducts.map(sp => ({
      store: sp.store,
      product: sp,
      price: sp.price,
    })).sort((a, b) => a.price - b.price);

    return {
      baseProduct,
      storeProducts,
      priceRange,
      stores,
    };
  }

  async searchProducts(query: string): Promise<BaseProduct[]> {
    const normalizedQuery = this._normalizeProductName(query);
    
    this._logger.log(`Searching products with query: "${query}" (normalized: "${normalizedQuery}")`);
    
    const products = await this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .where('baseProduct.name ILIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('baseProduct.brand ILIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('baseProduct.model ILIKE :query', { query: `%${normalizedQuery}%` })
      .andWhere('baseProduct.isActive = :isActive', { isActive: true })
      .orderBy('baseProduct.storeCount', 'DESC')
      .addOrderBy('baseProduct.name', 'ASC')
      .getMany();
    
    this._logger.log(`Found ${products.length} products, ${products.filter(p => !p.isActive).length} inactive`);
    
    return products;
  }

  async getProductWithImagesAndSpecs(baseProductId: string): Promise<{
    baseProduct: BaseProduct;
    image: string;
    specifications: any;
  }> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId },
      relations: ['storeProducts']
    });

    if (!baseProduct) {
      throw new Error('Product not found');
    }

    // Get image from first store product
    const firstStoreProduct = baseProduct.storeProducts?.[0];
    const productImage = firstStoreProduct?.image || baseProduct.image || "https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true";

    // Get specifications
    const specifications = {
      rating: baseProduct.specifications?.rating || null,
      categories: baseProduct.specifications?.categories || ["Toallas de Papel"],
      originalData: {
        brand: baseProduct.brand,
        categories: baseProduct.specifications?.categories || ["Toallas de Papel"],
        highResImageUrl: productImage
      }
    };

    return {
      baseProduct,
      image: productImage,
      specifications
    };
  }

  async processBatchProducts(products: Array<{
    name: string;
    brand?: string;
    specifications?: Record<string, any>;
    storeId?: string;
  }>): Promise<Map<string, BaseProduct>> {
    const results = new Map<string, BaseProduct>();
    
    this._logger.log(`Processing batch of ${products.length} products for matching`);

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
        this._logger.error(`Error processing product "${product.name}":`, error);
      }
    }

    this._logger.log(`Batch processing completed. ${results.size} products processed`);
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

      const uniqueStores = new Set(storeProducts.map(sp => sp.storeId).filter(Boolean));
      
      await this._baseProductRepository.update(baseProductId, {
        storeCount: uniqueStores.size,
        totalVariants: storeProducts.length,
      });

      this._logger.log(`Updated counts for baseProductId ${baseProductId}: ${uniqueStores.size} stores, ${storeProducts.length} variants`);
    } catch (error) {
      this._logger.error(`Error updating product counts for baseProductId ${baseProductId}:`, error);
      throw error;
    }
  }

  private _normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      // Remove extra spaces but keep structure
      .replace(/\s+/g, ' ')
      // Normalize common variations
      .replace(/\b(ml|mililitros?)\b/g, 'ml')
      .replace(/\b(g|gr|gramos?)\b/g, 'g')
      .replace(/\b(kg|kilos?)\b/g, 'kg')
      .replace(/\b(m|metros?)\b/g, 'm')
      .replace(/\b(cm|centimetros?)\b/g, 'cm')
      .replace(/\b(mm|milimetros?)\b/g, 'mm')
      .replace(/\b(un|unidades?)\b/g, 'un')
      .replace(/\b(pzs?|piezas?)\b/g, 'pzs')
      // Normalize specific product variations
      .replace(/\b(megarollo|mega rollo|mega-rollo)\b/g, 'megarollo')
      .replace(/\b(doble hoja|doble-hoja|doblehoja)\b/g, 'doble hoja')
      .replace(/\b(clásica|clasica|classica)\b/g, 'clasica')
      .replace(/\b(ultra|ultra-|ultra_)\b/g, 'ultra')
      .replace(/\b(gigante|gigante-|gigante_)\b/g, 'gigante')
      // Normalize brand variations
      .replace(/\b(nova|nova-|nova_)\b/g, 'nova')
      .replace(/\b(abolengo|abolengo-|abolengo_)\b/g, 'abolengo')
      // Remove parentheses and their contents for better matching
      .replace(/\([^)]*\)/g, '')
      // Normalize unit patterns - make them consistent
      .replace(/\b(\d+)\s*(un|unidades?)\s*(\d+)\s*(m|metros?)\b/g, '$3$4 $1$2')
      .replace(/\b(\d+)\s*(m|metros?)\s*(\d+)\s*(un|unidades?)\b/g, '$1$2 $3$4')
      // More aggressive normalization for similar products
      .replace(/\b(\d+)\s*(m|metros?)\s*(\d+)\s*(un|unidades?)\b/g, '$1$2 $3$4')
      .replace(/\b(\d+)\s*(un|unidades?)\s*(\d+)\s*(m|metros?)\b/g, '$3$4 $1$2')
      // Normalize spacing around numbers and units
      .replace(/\b(\d+)\s*(m|metros?)\b/g, '$1$2')
      .replace(/\b(\d+)\s*(un|unidades?)\b/g, '$1$2')
      // Remove trailing periods and common suffixes
      .replace(/\.$/, '')
      .replace(/\s+$/, '')
      // Remove common stop words but keep important ones
      .replace(/\b(de|del|en|con|para|por|sin|sobre|bajo|entre|hasta|desde|durante|mediante|según|tras|ante|contra)\b/g, ' ')
      // Clean up extra spaces again
      .replace(/\s+/g, ' ')
      .trim();
  }

  private _normalizeBrand(brand: string): string {
    return brand
      .toLowerCase()
      .trim()
      // Only remove extra spaces, keep special characters for brand names
      .replace(/\s+/g, ' ');
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
          exactBrand: normalizedBrand
        });
      }

      // Use more flexible name matching - at least 70% of words should match
      const nameWords = normalizedName.split(' ').filter(word => word.length > 2);
      if (nameWords.length > 0) {
        // Create conditions for partial word matches
        const nameConditions = nameWords.map((word, index) => 
          `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`
        ).join(' OR ');
        
        query.andWhere(`(${nameConditions})`, 
          nameWords.reduce((params, word, index) => {
            params[`nameWord${index}`] = `%${word}%`;
            return params;
          }, {})
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
          .andWhere('(LOWER(baseProduct.brand) LIKE LOWER(:brandPattern) OR baseProduct.brand IS NULL)', {
            brandPattern: `%${normalizedBrand}%`,
          });

        if (nameWords.length > 0) {
          const nameConditions = nameWords.map((word, index) => 
            `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`
          ).join(' OR ');
          
          query.andWhere(`(${nameConditions})`, 
            nameWords.reduce((params, word, index) => {
              params[`nameWord${index}`] = `%${word}%`;
              return params;
            }, {})
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
          const nameConditions = nameWords.map((word, index) => 
            `LOWER(baseProduct.name) LIKE LOWER(:nameWord${index})`
          ).join(' OR ');
          
          query.andWhere(`(${nameConditions})`, 
            nameWords.reduce((params, word, index) => {
              params[`nameWord${index}`] = `%${word}%`;
              return params;
            }, {})
          );
        }

        exactBrandMatches = await query
          .orderBy('baseProduct.storeCount', 'DESC')
          .limit(20)
          .getMany();
      }

      return exactBrandMatches;
    } catch (error) {
      this._logger.error(`Error finding similar base products for "${normalizedName}":`, error);
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
      const similarity = this._calculateSimilarity(
        normalizedName,
        normalizedBrand,
        candidate.name,
        candidate.brand,
      );

      // STRICT threshold for matching (85%+ required)
      if (similarity >= 0.85) {
        // If we have a brand match, boost the similarity
        let adjustedSimilarity = similarity;
        if (normalizedBrand && candidate.brand && 
            this._normalizeBrand(normalizedBrand) === this._normalizeBrand(candidate.brand)) {
          adjustedSimilarity = Math.min(1.0, similarity + 0.2);
        }

        // Prioritize products with more stores (more established)
        const storeCountBonus = Math.min(0.1, candidate.storeCount * 0.02);
        adjustedSimilarity = Math.min(1.0, adjustedSimilarity + storeCountBonus);

        if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
          bestMatch = { product: candidate, similarity: adjustedSimilarity };
        }
      }
    }

    return bestMatch;
  }

  private _calculateSimilarity(
    name1: string,
    brand1: string | null,
    name2: string,
    brand2: string | null,
  ): number {
    const nameSimilarity = this._calculateStringSimilarity(name1, name2);
    
    let brandSimilarity = 0;
    if (brand1 && brand2) {
      brandSimilarity = this._calculateStringSimilarity(brand1, brand2);
    } else if (!brand1 && !brand2) {
      brandSimilarity = 1;
    } else {
      brandSimilarity = 0.5;
    }

    // Check for specific product variations that should NOT match
    const variationPenalty = this._calculateVariationPenalty(name1, name2);
    
    // Apply penalty if products have different key specifications
    const finalSimilarity = (nameSimilarity * 0.7) + (brandSimilarity * 0.3) - variationPenalty;
    
    return Math.max(0, finalSimilarity); // Ensure similarity is not negative
  }

  private _calculateVariationPenalty(name1: string, name2: string): number {
    let penalty = 0;
    
    // Extract measurements and quantities
    const measurements1 = this._extractMeasurements(name1);
    const measurements2 = this._extractMeasurements(name2);
    
    // If both have measurements, check if they're different
    if (measurements1.length > 0 && measurements2.length > 0) {
      const hasDifferentMeasurements = measurements1.some(m1 => 
        !measurements2.some(m2 => this._areMeasurementsSimilar(m1, m2))
      );
      
      if (hasDifferentMeasurements) {
        penalty += 0.4; // High penalty for different measurements
      }
    }
    
    // Extract model numbers or SKUs
    const models1 = this._extractModels(name1);
    const models2 = this._extractModels(name2);
    
    if (models1.length > 0 && models2.length > 0) {
      const hasDifferentModels = models1.some(m1 => 
        !models2.some(m2 => m1 === m2)
      );
      
      if (hasDifferentModels) {
        penalty += 0.3; // Medium penalty for different models
      }
    }
    
    // Check for size variations (S, M, L, XL, etc.)
    const sizes1 = this._extractSizes(name1);
    const sizes2 = this._extractSizes(name2);
    
    if (sizes1.length > 0 && sizes2.length > 0) {
      const hasDifferentSizes = sizes1.some(s1 => 
        !sizes2.some(s2 => s1 === s2)
      );
      
      if (hasDifferentSizes) {
        penalty += 0.2; // Small penalty for different sizes
      }
    }
    
    return penalty;
  }

  private _extractMeasurements(text: string): string[] {
    const measurementRegex = /(\d+(?:\.\d+)?)\s*(g|gr|gramos?|kg|kilos?|ml|mililitros?|l|litros?|m|metros?|cm|centimetros?|mm|milimetros?|un|unidades?|pzs?|piezas?)/gi;
    const matches = text.match(measurementRegex);
    return matches || [];
  }

  private _extractModels(text: string): string[] {
    const modelRegex = /(?:modelo|model|ref|referencia|sku|art|articulo)[\s:]*([a-z0-9\-]+)/gi;
    const matches = text.match(modelRegex);
    return matches ? matches.map(m => m.replace(/^(?:modelo|model|ref|referencia|sku|art|articulo)[\s:]*/i, '')) : [];
  }

  private _extractSizes(text: string): string[] {
    const sizeRegex = /\b(xxs|xs|s|m|l|xl|xxl|xxxl|\d+)\b/gi;
    const matches = text.match(sizeRegex);
    return matches || [];
  }

  private _areMeasurementsSimilar(m1: string, m2: string): boolean {
    // Normalize measurements for comparison
    const normalizeMeasurement = (m: string) => {
      const num = parseFloat(m.replace(/[^\d.]/g, ''));
      const unit = m.replace(/[\d.]/g, '').toLowerCase();
      
      // Convert to base units for comparison
      if (unit.includes('g') && !unit.includes('kg')) return num; // grams
      if (unit.includes('kg')) return num * 1000; // kg to grams
      if (unit.includes('ml') && !unit.includes('l')) return num; // ml
      if (unit.includes('l') && !unit.includes('ml')) return num * 1000; // l to ml
      if (unit.includes('m') && !unit.includes('cm') && !unit.includes('mm')) return num; // meters
      if (unit.includes('cm')) return num / 100; // cm to meters
      if (unit.includes('mm')) return num / 1000; // mm to meters
      
      return num;
    };
    
    const val1 = normalizeMeasurement(m1);
    const val2 = normalizeMeasurement(m2);
    
    // Consider measurements similar if they're within 10% of each other
    const tolerance = 0.1;
    return Math.abs(val1 - val2) / Math.max(val1, val2) <= tolerance;
  }

  private _calculateStringSimilarity(str1: string, str2: string): number {
    // Extract numbers from both strings
    const numbers1 = this._extractNumbers(str1);
    const numbers2 = this._extractNumbers(str2);
    
    // If numbers are different, apply penalty
    let numberPenalty = 0;
    if (numbers1.length > 0 && numbers2.length > 0) {
      const numbersMatch = this._compareNumberArrays(numbers1, numbers2);
      if (!numbersMatch) {
        numberPenalty = 0.4; // 40% penalty for different numbers
      }
    }
    
    // Check for key product variations that should significantly reduce similarity
    const variationPenalty = this._calculateKeyVariationPenalty(str1, str2);
    
    const jaro = this._jaroSimilarity(str1, str2);
    const winkler = this._winklerBonus(str1, str2);
    
    const baseSimilarity = jaro + (winkler * 0.1);
    
    // Apply penalties
    return Math.max(0, baseSimilarity - numberPenalty - variationPenalty);
  }

  private _calculateKeyVariationPenalty(str1: string, str2: string): number {
    let penalty = 0;
    
    // Define key product variations that should not match
    const keyVariations = [
      { terms: ['clasica', 'clásica'], opposite: ['doble hoja', 'ultra', 'evolution'] },
      { terms: ['doble hoja'], opposite: ['clasica', 'clásica', 'ultra', 'evolution'] },
      { terms: ['ultra'], opposite: ['clasica', 'clásica', 'doble hoja', 'evolution'] },
      { terms: ['evolution'], opposite: ['clasica', 'clásica', 'doble hoja', 'ultra'] }
    ];
    
    for (const variation of keyVariations) {
      const hasTerm1 = variation.terms.some(term => 
        str1.toLowerCase().includes(term.toLowerCase())
      );
      const hasTerm2 = variation.terms.some(term => 
        str2.toLowerCase().includes(term.toLowerCase())
      );
      
      const hasOpposite1 = variation.opposite.some(term => 
        str1.toLowerCase().includes(term.toLowerCase())
      );
      const hasOpposite2 = variation.opposite.some(term => 
        str2.toLowerCase().includes(term.toLowerCase())
      );
      
      // If one has the term and the other has the opposite, apply heavy penalty
      if ((hasTerm1 && hasOpposite2) || (hasTerm2 && hasOpposite1)) {
        penalty += 0.5; // 50% penalty for conflicting variations
      }
    }
    
    return penalty;
  }

  private _jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

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

    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  }

  private _winklerBonus(str1: string, str2: string): number {
    let prefixLength = 0;
    const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
    
    for (let i = 0; i < maxPrefix; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }
    
    return prefixLength;
  }

  private _extractNumbers(str: string): number[] {
    // Extract all numbers from the string
    const matches = str.match(/\d+(?:\.\d+)?/g);
    if (!matches) return [];
    
    return matches.map(match => parseFloat(match));
  }

  private _compareNumberArrays(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    
    // Sort both arrays to compare regardless of order
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);
    
    for (let i = 0; i < sorted1.length; i++) {
      if (Math.abs(sorted1[i] - sorted2[i]) > 0.01) { // Allow small floating point differences
        return false;
      }
    }
    
    return true;
  }

  // Similarity methods
  async findSimilarProducts(options: {
    name: string;
    brand?: string;
    specifications?: Record<string, any>;
    threshold?: number;
    limit?: number;
  }): Promise<any[]> {
    const { name, brand, specifications, threshold = 0.5, limit = 10 } = options;

    this._logger.log(`Finding similar products for: "${name}" (brand: "${brand}", threshold: ${threshold})`);

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
        product: any;
        similarity: number;
      }> = [];

      for (const product of baseProducts) {
        const similarity = this._calculateProductSimilarity(
          { name, brand, specifications },
          { name: product.name, brand: product.brand, specifications: product.specifications },
          true // isForSuggestions = true
        );

        if (similarity >= threshold) {
          similarities.push({
            product,
            similarity
          });
        }
      }

      // Sort by similarity (highest first)
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Smart limiting: If we have truly perfect match (100%), only return that one
      // Otherwise, return top 3 suggestions
      let limitedSimilarities;
      const hasPerfectMatch = similarities.length > 0 && similarities[0].similarity >= 1.0;
      
      if (hasPerfectMatch) {
        // Only return the perfect match
        limitedSimilarities = similarities.slice(0, 1);
        this._logger.log(`Found perfect match (${(similarities[0].similarity * 100).toFixed(1)}%), returning only that one`);
      } else {
        // Return top 3 suggestions for all other cases
        limitedSimilarities = similarities.slice(0, Math.min(3, limit));
        this._logger.log(`No perfect match found, returning top ${limitedSimilarities.length} suggestions`);
      }

      // Format response
      const similarProducts = limitedSimilarities.map(({ product, similarity }) => {
        // Get image for the product
        const productImage = product.storeProducts?.[0]?.image || product.image || "https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true";
        
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
          storeProducts: product.storeProducts?.map((sp: any) => ({
            id: sp.id,
            name: sp.name,
            price: sp.price,
            image: sp.image,
            url: sp.url,
            store: sp.store?.name || 'Unknown'
          })) || []
        };
      });

      this._logger.log(`Found ${similarProducts.length} similar products for "${name}"`);

      return similarProducts;
    } catch (error) {
      this._logger.error(`Error finding similar products for "${name}":`, error);
      throw error;
    }
  }

  // Admin methods
  async findDuplicateGroups(options: {
    threshold?: number;
    limit?: number;
    includeSimilar?: boolean;
    brand?: string;
  } = {}): Promise<any[]> {
    const { threshold = 0.9, limit = 50, includeSimilar = true, brand } = options;
    
    this._logger.log(`🔍 Finding duplicate groups with threshold: ${threshold}, limit: ${limit}`);

    // Get all active base products
    const queryBuilder = this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .leftJoinAndSelect('baseProduct.storeProducts', 'storeProducts')
      .leftJoinAndSelect('storeProducts.store', 'store')
      .where('baseProduct.isActive = :isActive', { isActive: true });

    if (brand) {
      queryBuilder.andWhere('baseProduct.brand ILIKE :brand', { brand: `%${brand}%` });
    }

    const products = await queryBuilder
      .orderBy('baseProduct.brand', 'ASC')
      .addOrderBy('baseProduct.name', 'ASC')
      .getMany();

    this._logger.log(`Found ${products.length} active base products`);

    const duplicateGroups: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productId = product.id;

      if (processed.has(productId)) continue;

      const similarProducts = [product];
      processed.add(productId);

      // Find similar products
      for (let j = i + 1; j < products.length; j++) {
        const candidate = products[j];
        const candidateId = candidate.id;

        if (processed.has(candidateId)) continue;

        const similarity = this._calculateProductSimilarity(product, candidate, false); // isForSuggestions = false
        
        if (similarity >= threshold) {
          similarProducts.push(candidate);
          processed.add(candidateId);
        }
      }

      // Only include groups with duplicates and high similarity
      if (similarProducts.length > 1) {
        const group = this._createDuplicateGroup(similarProducts, threshold);
        if (group) { // Only add if similarity is high enough
          duplicateGroups.push(group);
        }
      }
    }

    // Sort by similarity and count
    duplicateGroups.sort((a, b) => {
      if (b.avgSimilarity !== a.avgSimilarity) {
        return b.avgSimilarity - a.avgSimilarity;
      }
      return b.count - a.count;
    });

    // Limit results
    const limitedGroups = duplicateGroups.slice(0, limit);

    this._logger.log(`Found ${duplicateGroups.length} duplicate groups (showing ${limitedGroups.length})`);

    return limitedGroups;
  }

  private _calculateProductSimilarity(product1: any, product2: any, isForSuggestions: boolean = false): number {
    const name1 = this._normalizeProductName(product1.name);
    const name2 = this._normalizeProductName(product2.name);
    
    // Check if names are exactly the same (after normalization)
    if (name1 === name2) {
      return 1.0; // 100% similarity for identical names
    }
    
    // Check if products have the same words in different order (very high similarity)
    const words1 = name1.split(/\s+/).filter(word => word.length > 2).sort();
    const words2 = name2.split(/\s+/).filter(word => word.length > 2).sort();
    
    if (words1.length === words2.length && words1.length > 0) {
      const sameWords = words1.every((word, index) => word === words2[index]);
      if (sameWords) {
        return 0.98; // 98% similarity for same words in different order
      }
    }
    
    // Calculate brand similarity
    const brandSimilarity = this._calculateBrandSimilarity(product1.brand, product2.brand);
    
    // For suggestions, be more flexible with brands
    if (!isForSuggestions) {
      // STRICT CHECK 1: Brands must be very similar (for duplicates)
      if (brandSimilarity < 0.8) {
        return Math.min(0.1, this._calculateStringSimilarity(name1, name2) * 0.2);
      }
    } else {
      // For suggestions, apply brand penalty but don't eliminate completely
      if (brandSimilarity < 0.5) {
        // Apply penalty but still allow some similarity
        const baseSimilarity = this._calculateStringSimilarity(name1, name2);
        return Math.min(0.6, baseSimilarity * 0.7);
      }
    }
    
    // STRICT CHECK 2: Check for key product variations that should NOT match
    const variationPenalty = this._calculateKeyVariationPenalty(name1, name2);
    if (variationPenalty > 0) {
      return Math.min(0.2, this._calculateStringSimilarity(name1, name2) * 0.3);
    }
    
    // Calculate word-based similarity (order independent)
    const wordSimilarity = this._calculateWordSimilarity(name1, name2);
    
    // For suggestions, be more flexible with word similarity
    const wordThreshold = isForSuggestions ? 0.5 : 0.7;
    if (wordSimilarity < wordThreshold) {
      return Math.min(0.3, wordSimilarity * 0.4);
    }
    
    // STRICT CHECK 4: Check if numbers are different
    const numbers1 = this._extractNumbers(name1);
    const numbers2 = this._extractNumbers(name2);
    
    if (numbers1.length > 0 && numbers2.length > 0) {
      const numbersMatch = this._compareNumberArrays(numbers1, numbers2);
      if (!numbersMatch) {
        return Math.min(0.4, wordSimilarity * 0.5);
      }
    }
    
    // STRICT CHECK 5: Check if measurements are different
    const measurements1 = this._extractMeasurements(name1);
    const measurements2 = this._extractMeasurements(name2);
    
    if (measurements1.length > 0 && measurements2.length > 0) {
      const measurementsMatch = measurements1.some(m1 => 
        measurements2.some(m2 => this._areMeasurementsSimilar(m1, m2))
      );
      if (!measurementsMatch) {
        return Math.min(0.5, wordSimilarity * 0.6);
      }
    }
    
    // Calculate final similarity with weighted components
    const nameSimilarity = this._calculateStringSimilarity(name1, name2);
    
    // Different weights for suggestions vs duplicates
    if (isForSuggestions) {
      // For suggestions: 50% word similarity, 30% name similarity, 20% brand similarity
      const finalSimilarity = (wordSimilarity * 0.5) + (nameSimilarity * 0.3) + (brandSimilarity * 0.2);
      return Math.min(0.95, finalSimilarity);
    } else {
      // For duplicates: 60% word similarity, 30% name similarity, 10% brand similarity
      const finalSimilarity = (wordSimilarity * 0.6) + (nameSimilarity * 0.3) + (brandSimilarity * 0.1);
      return Math.min(0.95, finalSimilarity);
    }
  }

  private _calculateWordSimilarity(name1: string, name2: string): number {
    // Split names into words and normalize
    const words1 = name1.split(/\s+/).filter(word => word.length > 2);
    const words2 = name2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Calculate word overlap (order independent) - more generous matching
    const commonWords = words1.filter(word1 => 
      words2.some(word2 => this._calculateStringSimilarity(word1, word2) > 0.7)
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
    return (wordOverlap * 0.8) + (orderSimilarity * 0.2);
  }

  private _calculateWordOrderSimilarity(words1: string[], words2: string[]): number {
    if (words1.length !== words2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < words1.length; i++) {
      if (this._calculateStringSimilarity(words1[i], words2[i]) > 0.8) {
        matches++;
      }
    }
    
    return matches / words1.length;
  }

  private _calculateBrandSimilarity(brand1: string | null, brand2: string | null): number {
    if (!brand1 && !brand2) return 1;
    if (!brand1 || !brand2) return 0;
    
    const normalized1 = this._normalizeBrand(brand1);
    const normalized2 = this._normalizeBrand(brand2);
    
    return this._calculateStringSimilarity(normalized1, normalized2);
  }

  private _calculateProductTypeSimilarity(name1: string, name2: string): number {
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
    if (lowerName.includes('alcohol') || lowerName.includes('isopropílico') || lowerName.includes('desinfectante')) {
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
      ['cream', 'lotion']
    ];
    
    for (const group of similarTypes) {
      if (group.includes(type1) && group.includes(type2)) {
        return true;
      }
    }
    
    return false;
  }

  private _calculateMeasurementsSimilarity(name1: string, name2: string): number {
    const measurements1 = this._extractMeasurements(name1);
    const measurements2 = this._extractMeasurements(name2);
    
    if (measurements1.length === 0 && measurements2.length === 0) return 1;
    if (measurements1.length === 0 || measurements2.length === 0) return 0.5;
    
    // Check if measurements are similar
    const similarCount = measurements1.filter(m1 => 
      measurements2.some(m2 => this._areMeasurementsSimilar(m1, m2))
    ).length;
    
    return similarCount / Math.max(measurements1.length, measurements2.length);
  }

  private _createDuplicateGroup(products: any[], threshold: number): any {
    const primaryProduct = products[0];
    const brand = primaryProduct.brand || 'Sin marca';
    
    // Calculate group statistics
    const totalStores = new Set(products.flatMap(p => 
      p.storeProducts?.map((sp: any) => sp.storeId).filter(Boolean) || []
    )).size;
    
    const totalVariants = products.reduce((sum, p) => sum + (p.totalVariants || 0), 0);
    
    // Calculate average similarity
    const avgSimilarity = products.slice(1).reduce((sum, p) => 
      sum + this._calculateProductSimilarity(primaryProduct, p, false), 0
    ) / (products.length - 1);
    
    // Only include groups with high similarity (configurable threshold)
    if (avgSimilarity < 0.8) {
      return null; // Skip groups that are not similar enough
    }
    
    // Get product image from first store product
    const firstStoreProduct = products[0].storeProducts?.[0];
    const productImage = firstStoreProduct?.image || products[0].image || "https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true";
    
    return {
      id: `group_${primaryProduct.id}`,
      avgSimilarity: Math.round(avgSimilarity * 100) / 100,
      threshold,
      count: products.length,
      brand,
      image: productImage,
      totalStores,
      totalVariants,
      products: products.map(p => {
        // Get image for each product
        const productImage = p.storeProducts?.[0]?.image || p.image || "https://jumbocl.vtexassets.com/arquivos/ids/345924-900-900?width=900&height=900&aspect=true";
        
        // Get URL for each product
        const productUrl = p.storeProducts?.[0]?.url || null;
        
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          image: productImage,
          url: productUrl,
          storeCount: p.storeCount,
          totalVariants: p.totalVariants,
          createdAt: p.createdAt,
          storeProducts: p.storeProducts?.map((sp: any) => ({
            id: sp.id,
            name: sp.name,
            price: sp.price,
            image: sp.image,
            url: sp.url,
            store: sp.store?.name || 'Unknown'
          })) || []
        };
      })
    };
  }

  private _suggestMergeData(products: any[]): any {
    // Use the product with most stores as primary
    const primaryProduct = products.reduce((prev, current) => 
      (current.storeCount || 0) > (prev.storeCount || 0) ? current : prev
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
      specifications: combinedSpecs
    };
  }

  private _getMergeRecommendation(products: any[], confidence: string): string {
    if (confidence === 'high') {
      return 'Highly recommended to merge - products are very similar';
    } else if (confidence === 'medium') {
      return 'Consider merging - products are similar but review carefully';
    } else {
      return 'Review manually - similarity is low, may not be duplicates';
    }
  }

  async mergeProducts(baseProductId: string, duplicateProductIds: string[]): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId, isActive: true }
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Update store products to point to the main product
    for (const duplicateId of duplicateProductIds) {
      await this._storeProductRepository.update(
        { baseProductId: duplicateId },
        { baseProductId: baseProductId }
      );

      // Mark duplicate as inactive
      await this._baseProductRepository.update(duplicateId, { isActive: false });
    }

    // Update counts for the main product
    await this.updateProductCounts(baseProductId);

    return {
      message: 'Products merged successfully',
      baseProductId,
      mergedCount: duplicateProductIds.length
    };
  }

  async associateStoreProduct(storeProductId: string, baseProductId: string): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId }
    });

    if (!storeProduct) {
      throw new Error('Store product not found');
    }

    const baseProduct = await this._baseProductRepository.findOne({
      where: { id: baseProductId, isActive: true }
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Check if store product is already associated
    if (storeProduct.baseProductId) {
      throw new Error('Store product is already associated with a base product');
    }

    // Update the store product to point to the base product
    await this._storeProductRepository.update(storeProductId, {
      baseProductId: baseProductId
    });

    // Update counts for the base product
    await this.updateProductCounts(baseProductId);

    this._logger.log(`✅ Store product "${storeProduct.name}" associated with base product "${baseProduct.name}"`);

    return {
      message: 'Store product associated successfully',
      storeProductId,
      baseProductId,
      storeProduct: {
        id: storeProduct.id,
        name: storeProduct.name,
        storeId: storeProduct.storeId
      },
      baseProduct: {
        id: baseProduct.id,
        name: baseProduct.name,
        brand: baseProduct.brand
      }
    };
  }

  async disassociateStoreProduct(storeProductId: string): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId }
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
      baseProductId: null
    });

    // Update counts for the base product
    await this.updateProductCounts(baseProductId);

    this._logger.log(`✅ Store product "${storeProduct.name}" disassociated from base product`);

    return {
      message: 'Store product disassociated successfully',
      storeProductId,
      baseProductId
    };
  }

  async deleteBaseProduct(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id }
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Count associated store products before disassociating
    const associatedCount = await this._storeProductRepository.count({
      where: { baseProductId: id }
    });

    // Disassociate all store products when deactivating base product
    if (associatedCount > 0) {
      await this._storeProductRepository.update(
        { baseProductId: id },
        { baseProductId: null }
      );
      
      this._logger.log(`✅ Disassociated ${associatedCount} store products from base product "${baseProduct.name}"`);
    }

    // Soft delete - mark as inactive
    await this._baseProductRepository.update(id, { isActive: false });

    this._logger.log(`✅ Base product "${baseProduct.name}" deactivated and ${associatedCount} store products disassociated`);

    return {
      message: 'Base product deactivated successfully and all store products disassociated',
      baseProductId: id,
      disassociatedStoreProducts: associatedCount,
      isActive: false
    };
  }

  async getBaseProducts(options: {
    page: number;
    limit: number;
    search?: string;
    brand?: string;
    isActive?: boolean;
  }): Promise<any> {
    const { page, limit, search, brand, isActive } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .leftJoinAndSelect('baseProduct.storeProducts', 'storeProducts')
      .leftJoinAndSelect('storeProducts.store', 'store');

    if (search) {
      const normalizedSearch = this._normalizeProductName(search);
      queryBuilder.andWhere(
        '(baseProduct.name ILIKE :search OR baseProduct.brand ILIKE :search OR baseProduct.model ILIKE :search)',
        { search: `%${normalizedSearch}%` }
      );
    }

    if (brand) {
      queryBuilder.andWhere('baseProduct.brand ILIKE :brand', { brand: `%${brand}%` });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('baseProduct.isActive = :isActive', { isActive });
    }

    const [products, total] = await queryBuilder
      .orderBy('baseProduct.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateBaseProduct(id: string, updateData: Partial<BaseProduct>): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id }
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
      id
    };
  }

  async suggestAssociations(storeProductId: string, threshold: number = 0.7): Promise<any> {
    const storeProduct = await this._storeProductRepository.findOne({
      where: { id: storeProductId },
      relations: ['store']
    });

    if (!storeProduct) {
      throw new Error('Store product not found');
    }

    const normalizedName = this._normalizeProductName(storeProduct.name);
    const normalizedBrand = this._normalizeBrand(storeProduct.metadata?.brand || '');

    // Find similar base products
    const baseProducts = await this._baseProductRepository
      .createQueryBuilder('baseProduct')
      .where('baseProduct.isActive = :isActive', { isActive: true })
      .andWhere('baseProduct.brand ILIKE :brand', { brand: `%${normalizedBrand}%` })
      .getMany();

    const suggestions: Array<{
      baseProduct: BaseProduct;
      similarity: number;
      matchReason: string;
    }> = [];
    for (const baseProduct of baseProducts) {
      const similarity = this._calculateSimilarity(
        normalizedName,
        normalizedBrand,
        baseProduct.name,
        baseProduct.brand
      );

      if (similarity >= threshold) {
        suggestions.push({
          baseProduct,
          similarity,
          matchReason: this._getMatchReason(storeProduct.name, baseProduct.name)
        });
      }
    }

    return {
      storeProduct,
      suggestions: suggestions.sort((a, b) => b.similarity - a.similarity)
    };
  }

  async getBaseProductById(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id },
      relations: ['storeProducts', 'storeProducts.store', 'storeProducts.creator']
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

    const savedBaseProduct = await this._baseProductRepository.save(baseProduct);

    this._logger.log(`✅ Created base product: "${savedBaseProduct.name}" (ID: ${savedBaseProduct.id})`);

    return savedBaseProduct;
  }

  async hardDeleteBaseProduct(id: string): Promise<any> {
    const baseProduct = await this._baseProductRepository.findOne({
      where: { id }
    });

    if (!baseProduct) {
      throw new Error('Base product not found');
    }

    // Disassociate all store products
    const disassociatedCount = await this._storeProductRepository.update(
      { baseProductId: id },
      { baseProductId: null }
    );

    // Hard delete the base product
    await this._baseProductRepository.remove(baseProduct);

    this._logger.log(`✅ Base product "${baseProduct.name}" hard deleted and ${disassociatedCount.affected} store products disassociated`);

    return {
      message: 'Base product hard deleted successfully',
      baseProductId: id,
      disassociatedStoreProducts: disassociatedCount.affected || 0
    };
  }

  private _extractProductKey(name: string, brand: string): string {
    const normalized = this._normalizeProductName(name);
    const brandNormalized = (brand || '').toLowerCase().trim();
    
    // Extract measurements
    const measurements = normalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];
    const measurementsStr = measurements.sort().join(' ');
    
    // Extract product type
    const productType = normalized
      .replace(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g, '')
      .replace(/\b(toalla|papel|de|del|en|con|para|por|sin|sobre|bajo|entre|hasta|desde|durante|mediante|según|tras|ante|contra)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return `${brandNormalized}|${productType}|${measurementsStr}`;
  }

  private _getMatchReason(storeProductName: string, baseProductName: string): string {
    const storeNormalized = this._normalizeProductName(storeProductName);
    const baseNormalized = this._normalizeProductName(baseProductName);
    
    if (storeNormalized === baseNormalized) {
      return 'Exact match';
    }
    
    const storeMeasurements: string[] = storeNormalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];
    const baseMeasurements: string[] = baseNormalized.match(/\d+(?:\.\d+)?(?:m|ml|g|kg|un|pzs)/g) || [];
    
    if (storeMeasurements.length > 0 && baseMeasurements.length > 0) {
      const commonMeasurements = storeMeasurements.filter((m: string) => baseMeasurements.includes(m));
      if (commonMeasurements.length > 0) {
        return `Similar measurements: ${commonMeasurements.join(', ')}`;
      }
    }
    
    return 'Similar product name';
  }
}

