import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StoreProduct,
} from '../entities/store-product.entity';
import {
  CreateStoreProductDto,
} from '../dto';
import {
  IStoreProductResponse,
  IStoreProductSummary,
  IStoreProductFilter,
} from '../interfaces/store-product.interface';
import { ICategoryResponse } from '../interfaces/category.interface';
import { User } from '../../auth/entities/user.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class StoreProductsService {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async createStoreProduct(
    createStoreProductDto: CreateStoreProductDto,
    user: User,
    categoryNames?: string[],
  ): Promise<IStoreProductResponse> {
    // Create new store product with minimal data and defaults
    const storeProduct = this.storeProductRepository.create({
      ...createStoreProductDto,
      // Set defaults for required fields
      lastScraped: new Date(),
      notes: 'Created from scraping data',
      createdBy: user.id,
    });

    const savedStoreProduct =
      await this.storeProductRepository.save(storeProduct);

    // Handle categories if provided
    if (categoryNames && categoryNames.length > 0) {
      const categories = await this.categoriesService.findOrCreateCategories(categoryNames);
      savedStoreProduct.categories = categories;
      await this.storeProductRepository.save(savedStoreProduct);
    }

    return this.mapToStoreProductResponse(savedStoreProduct);
  }

  async checkDuplicateStoreProduct(
    storeProductId?: string,
    url?: string,
  ): Promise<StoreProduct | null> {
    if (!storeProductId && !url) {
      return null;
    }

    const queryBuilder = this.storeProductRepository.createQueryBuilder('storeProduct');

    if (storeProductId && url) {
      queryBuilder.where(
        '(storeProduct.storeProductId = :storeProductId OR storeProduct.url = :url)',
        { storeProductId, url }
      );
    } else if (storeProductId) {
      queryBuilder.where('storeProduct.storeProductId = :storeProductId', { storeProductId });
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
  ): Promise<{ data: IStoreProductResponse[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoinAndSelect('storeProduct.creator', 'creator')
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

  async getStoreProductById(id: string, user: User): Promise<IStoreProductResponse> {
    const storeProduct = await this.storeProductRepository.findOne({
      where: { id },
      relations: ['creator', 'categories'],
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
      relations: ['creator', 'categories'],
    });

    if (!storeProduct) {
      throw new NotFoundException(`Store product with ID ${id} not found`);
    }

    // Update fields
    Object.assign(storeProduct, updateData);

    const updatedStoreProduct = await this.storeProductRepository.save(storeProduct);
    return this.mapToStoreProductResponse(updatedStoreProduct);
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
  private applyStoreProductFilters(queryBuilder: any, filter: IStoreProductFilter): void {
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
  }

  private mapToStoreProductResponse(storeProduct: StoreProduct): IStoreProductResponse {
    return {
      id: storeProduct.id,
      name: storeProduct.name,
      description: storeProduct.description,
      url: storeProduct.url,
      sku: storeProduct.sku,
      storeProductId: storeProduct.storeProductId,
      image: storeProduct.image,
      metadata: storeProduct.metadata,
      lastScraped: storeProduct.lastScraped,
      notes: storeProduct.notes,
      createdAt: storeProduct.createdAt,
      updatedAt: storeProduct.updatedAt,
      creatorId: storeProduct.createdBy,
      creatorName: storeProduct.creator
        ? `${storeProduct.creator.firstName} ${storeProduct.creator.lastName}`
        : 'Unknown',
      displayName: storeProduct.displayName,
      createdBy: storeProduct.createdBy,
      categories: storeProduct.categories?.map(category => ({
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

  private mapToStoreProductSummary(storeProduct: StoreProduct): IStoreProductSummary {
    return {
      id: storeProduct.id,
      name: storeProduct.name,
      description: storeProduct.description,
      url: storeProduct.url,
      sku: storeProduct.sku,
      storeProductId: storeProduct.storeProductId,
      image: storeProduct.image,
      lastScraped: storeProduct.lastScraped,
      createdAt: storeProduct.createdAt,
      creatorName: storeProduct.creator
        ? `${storeProduct.creator.firstName} ${storeProduct.creator.lastName}`
        : 'Unknown',
      categories: storeProduct.categories?.map(category => ({
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
}