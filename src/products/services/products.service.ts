import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In, IsNull, Not } from 'typeorm';
import { Product, ProductStatus, ProductType, ProductCondition } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { IProductResponse, IProductSummary, IProductFilter, IProductAnalytics, IProductSearchResult, IProductBulkOperation, IProductBulkOperationInput } from '../interfaces/product.interface';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(createProductDto: CreateProductDto, user: User): Promise<IProductResponse> {
    // Check if product code already exists
    const existingProduct = await this.productRepository.findOne({
      where: { code: createProductDto.code }
    });

    if (existingProduct) {
      throw new BadRequestException(`Product with code '${createProductDto.code}' already exists`);
    }

    // Create new product
    const product = this.productRepository.create({
      ...createProductDto,
      createdBy: user.id
    });

    const savedProduct = await this.productRepository.save(product);
    return this.mapToProductResponse(savedProduct);
  }

  async getAllProducts(
    user: User,
    filter: IProductFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<IProductSearchResult> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.creator', 'creator')
      .orderBy('product.createdAt', 'DESC');

    // Apply filters
    this.applyProductFilters(queryBuilder, filter);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.offset(offset).limit(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    const productSummaries = products.map(product => this.mapToProductSummary(product));
    const totalPages = Math.ceil(total / limit);

    return {
      products: productSummaries,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async getProductById(id: string, user: User): Promise<IProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return this.mapToProductResponse(product);
  }

  async getProductByCode(code: string, user: User): Promise<IProductResponse> {
    const product = await this.productRepository.findOne({
      where: { code },
      relations: ['creator']
    });

    if (!product) {
      throw new NotFoundException(`Product with code '${code}' not found`);
    }

    return this.mapToProductResponse(product);
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, user: User): Promise<IProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Check if user can edit this product
    if (!this.canUserEditProduct(user, product)) {
      throw new ForbiddenException('You do not have permission to edit this product');
    }

    // Check if code is being changed and if it's already taken
    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existingProduct = await this.productRepository.findOne({
        where: { code: updateProductDto.code }
      });

      if (existingProduct) {
        throw new BadRequestException(`Product with code '${updateProductDto.code}' already exists`);
      }
    }

    // Update product
    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    return this.mapToProductResponse(updatedProduct);
  }

  async deleteProduct(id: string, user: User): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Check if user can delete this product
    if (!this.canUserDeleteProduct(user, product)) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    await this.productRepository.remove(product);
  }

  async changeProductStatus(id: string, status: ProductStatus, user: User): Promise<IProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Check if user can change status
    if (!this.canUserChangeProductStatus(user, product)) {
      throw new ForbiddenException('You do not have permission to change this product status');
    }

    product.status = status;
    const updatedProduct = await this.productRepository.save(product);

    return this.mapToProductResponse(updatedProduct);
  }

  async getProductAnalytics(user: User): Promise<IProductAnalytics> {
    // Check if user has permission to view analytics
    if (!this.canUserViewAnalytics(user)) {
      throw new ForbiddenException('You do not have permission to view product analytics');
    }

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      discontinuedProducts,
      productsByType,
      productsByStatus,
      productsByCategory,
      productsByBrand,
      averageWarranty,
      productsWithWarranty,
      productsWithDimensions,
      productsWithWeight,
      topCategories,
      topBrands,
      recentProducts,
      productsCreatedThisMonth,
      productsCreatedThisYear
    ] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { status: ProductStatus.ACTIVE } }),
      this.productRepository.count({ where: { status: ProductStatus.INACTIVE } }),
      this.productRepository.count({ where: { status: ProductStatus.DISCONTINUED } }),
      this.getProductsByType(),
      this.getProductsByStatus(),
      this.getProductsByCategory(),
      this.getProductsByBrand(),
      this.getAverageWarranty(),
      this.productRepository.count({ where: { warrantyMonths: Not(IsNull()) } }),
      this.productRepository.count({ where: { length: Not(IsNull()), width: Not(IsNull()), height: Not(IsNull()) } }),
      this.productRepository.count({ where: { weight: Not(IsNull()) } }),
      this.getTopCategories(),
      this.getTopBrands(),
      this.getRecentProducts(),
      this.getProductsCreatedThisMonth(),
      this.getProductsCreatedThisYear()
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      discontinuedProducts,
      productsByType,
      productsByStatus,
      productsByCategory,
      productsByBrand,
      averageWarranty,
      productsWithWarranty,
      productsWithDimensions,
      productsWithWeight,
      topCategories,
      topBrands,
      recentProducts,
      productsCreatedThisMonth,
      productsCreatedThisYear
    };
  }

  async bulkUpdateProducts(operation: IProductBulkOperationInput, user: User): Promise<IProductBulkOperation> {
    // Check if user has permission for bulk operations
    if (!this.canUserPerformBulkOperations(user)) {
      throw new ForbiddenException('You do not have permission to perform bulk operations');
    }

    const result: IProductBulkOperation = {
      ...operation,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (const productId of operation.productIds) {
      try {
        switch (operation.operation) {
          case 'activate':
            await this.changeProductStatus(productId, ProductStatus.ACTIVE, user);
            break;
          case 'deactivate':
            await this.changeProductStatus(productId, ProductStatus.INACTIVE, user);
            break;
          case 'discontinue':
            await this.changeProductStatus(productId, ProductStatus.DISCONTINUED, user);
            break;
          case 'delete':
            await this.deleteProduct(productId, user);
            break;
          case 'update':
            if (operation.data) {
              await this.updateProduct(productId, operation.data, user);
            }
            break;
        }
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          productId,
          error: error.message
        });
      }
    }

    return result;
  }

  // Private helper methods
  private applyProductFilters(queryBuilder: any, filter: IProductFilter): void {
    if (filter.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.code ILIKE :search)',
        { search: `%${filter.search}%` }
      );
    }

    if (filter.category) {
      queryBuilder.andWhere('product.category = :category', { category: filter.category });
    }

    if (filter.subcategory) {
      queryBuilder.andWhere('product.subcategory = :subcategory', { subcategory: filter.subcategory });
    }

    if (filter.brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand: filter.brand });
    }

    if (filter.type) {
      queryBuilder.andWhere('product.type = :type', { type: filter.type });
    }

    if (filter.status) {
      queryBuilder.andWhere('product.status = :status', { status: filter.status });
    }

    if (filter.condition) {
      queryBuilder.andWhere('product.condition = :condition', { condition: filter.condition });
    }

    if (filter.hasWarranty !== undefined) {
      if (filter.hasWarranty) {
        queryBuilder.andWhere('product.warrantyMonths IS NOT NULL AND product.warrantyMonths > 0');
      } else {
        queryBuilder.andWhere('(product.warrantyMonths IS NULL OR product.warrantyMonths = 0)');
      }
    }

    if (filter.hasDimensions !== undefined) {
      if (filter.hasDimensions) {
        queryBuilder.andWhere('product.length IS NOT NULL AND product.width IS NOT NULL AND product.height IS NOT NULL');
      } else {
        queryBuilder.andWhere('(product.length IS NULL OR product.width IS NULL OR product.height IS NULL)');
      }
    }

    if (filter.hasWeight !== undefined) {
      if (filter.hasWeight) {
        queryBuilder.andWhere('product.weight IS NOT NULL AND product.weight > 0');
      } else {
        queryBuilder.andWhere('(product.weight IS NULL OR product.weight = 0)');
      }
    }

    if (filter.minWeight !== undefined) {
      queryBuilder.andWhere('product.weight >= :minWeight', { minWeight: filter.minWeight });
    }

    if (filter.maxWeight !== undefined) {
      queryBuilder.andWhere('product.weight <= :maxWeight', { maxWeight: filter.maxWeight });
    }

    if (filter.minWarranty !== undefined) {
      queryBuilder.andWhere('product.warrantyMonths >= :minWarranty', { minWarranty: filter.minWarranty });
    }

    if (filter.maxWarranty !== undefined) {
      queryBuilder.andWhere('product.warrantyMonths <= :maxWarranty', { maxWarranty: filter.maxWarranty });
    }

    if (filter.tags && filter.tags.length > 0) {
      queryBuilder.andWhere('product.tags @> :tags', { tags: filter.tags });
    }

    if (filter.features && filter.features.length > 0) {
      queryBuilder.andWhere('product.features @> :features', { features: filter.features });
    }

    if (filter.createdBy) {
      queryBuilder.andWhere('product.createdBy = :createdBy', { createdBy: filter.createdBy });
    }

    if (filter.createdAfter) {
      queryBuilder.andWhere('product.createdAt >= :createdAfter', { createdAfter: filter.createdAfter });
    }

    if (filter.createdBefore) {
      queryBuilder.andWhere('product.createdAt <= :createdBefore', { createdBefore: filter.createdBefore });
    }
  }

  private canUserEditProduct(user: User, product: Product): boolean {
    const userRoles = user.roles.map(role => role.name.toLowerCase());
    return userRoles.includes(RoleType.SUPER_ADMIN) || 
           userRoles.includes(RoleType.ADMIN) || 
           userRoles.includes(RoleType.STORE_ADMIN) ||
           product.createdBy === user.id;
  }

  private canUserDeleteProduct(user: User, product: Product): boolean {
    const userRoles = user.roles.map(role => role.name.toLowerCase());
    return userRoles.includes(RoleType.SUPER_ADMIN) || 
           userRoles.includes(RoleType.ADMIN);
  }

  private canUserChangeProductStatus(user: User, product: Product): boolean {
    const userRoles = user.roles.map(role => role.name.toLowerCase());
    return userRoles.includes(RoleType.SUPER_ADMIN) || 
           userRoles.includes(RoleType.ADMIN) || 
           userRoles.includes(RoleType.STORE_ADMIN);
  }

  private canUserViewAnalytics(user: User): boolean {
    const userRoles = user.roles.map(role => role.name.toLowerCase());
    return userRoles.includes(RoleType.SUPER_ADMIN) || 
           userRoles.includes(RoleType.ADMIN) || 
           userRoles.includes(RoleType.STORE_ADMIN);
  }

  private canUserPerformBulkOperations(user: User): boolean {
    const userRoles = user.roles.map(role => role.name.toLowerCase());
    return userRoles.includes(RoleType.SUPER_ADMIN) || 
           userRoles.includes(RoleType.ADMIN);
  }

  private mapToProductResponse(product: Product): IProductResponse {
    return {
      ...product,
      creatorId: product.creator.id,
      creatorName: product.creator.firstName + ' ' + product.creator.lastName,
      creatorEmail: product.creator.email
    };
  }

  private mapToProductSummary(product: Product): IProductSummary {
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      brand: product.brand,
      category: product.category,
      type: product.type,
      status: product.status,
      image: product.image,
      createdAt: product.createdAt
    };
  }

  // Analytics helper methods
  private async getProductsByType(): Promise<Record<ProductType, number>> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.type')
      .getRawMany();

    const productsByType: Record<ProductType, number> = {
      [ProductType.PHYSICAL]: 0,
      [ProductType.DIGITAL]: 0,
      [ProductType.SERVICE]: 0,
      [ProductType.SUBSCRIPTION]: 0
    };

    result.forEach(item => {
      productsByType[item.type] = parseInt(item.count);
    });

    return productsByType;
  }

  private async getProductsByStatus(): Promise<Record<ProductStatus, number>> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.status')
      .getRawMany();

    const productsByStatus: Record<ProductStatus, number> = {
      [ProductStatus.ACTIVE]: 0,
      [ProductStatus.INACTIVE]: 0,
      [ProductStatus.DISCONTINUED]: 0,
      [ProductStatus.OUT_OF_STOCK]: 0,
      [ProductStatus.COMING_SOON]: 0
    };

    result.forEach(item => {
      productsByStatus[item.status] = parseInt(item.count);
    });

    return productsByStatus;
  }

  private async getProductsByCategory(): Promise<Record<string, number>> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .getRawMany();

    const productsByCategory: Record<string, number> = {};
    result.forEach(item => {
      productsByCategory[item.category] = parseInt(item.count);
    });

    return productsByCategory;
  }

  private async getProductsByBrand(): Promise<Record<string, number>> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.brand', 'brand')
      .addSelect('COUNT(*)', 'count')
      .where('product.brand IS NOT NULL')
      .groupBy('product.brand')
      .getRawMany();

    const productsByBrand: Record<string, number> = {};
    result.forEach(item => {
      productsByBrand[item.brand] = parseInt(item.count);
    });

    return productsByBrand;
  }

  private async getAverageWarranty(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('AVG(product.warrantyMonths)', 'average')
      .where('product.warrantyMonths IS NOT NULL AND product.warrantyMonths > 0')
      .getRawOne();

    return result?.average ? parseFloat(result.average) : 0;
  }

  private async getTopCategories(): Promise<Array<{ category: string; count: number }>> {
    return await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
  }

  private async getTopBrands(): Promise<Array<{ brand: string; count: number }>> {
    return await this.productRepository
      .createQueryBuilder('product')
      .select('product.brand', 'brand')
      .addSelect('COUNT(*)', 'count')
      .where('product.brand IS NOT NULL')
      .groupBy('product.brand')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
  }

  private async getRecentProducts(): Promise<IProductSummary[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.creator', 'creator')
      .orderBy('product.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return products.map(product => this.mapToProductSummary(product));
  }

  private async getProductsCreatedThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return await this.productRepository.count({
      where: { createdAt: Between(startOfMonth, new Date()) }
    });
  }

  private async getProductsCreatedThisYear(): Promise<number> {
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    return await this.productRepository.count({
      where: { createdAt: Between(startOfYear, new Date()) }
    });
  }
}
