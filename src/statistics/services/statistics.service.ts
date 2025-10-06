import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../auth/entities/user.entity';
import { Store, StoreStatus } from '../../stores/entities/store.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import { StoreProduct } from '../../store-products/entities/store-product.entity';
import { Category } from '../../store-products/entities/category.entity';

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  pendingVerification: number;
  suspended: number;
  deleted: number;
}

export interface StoreStatistics {
  total: number;
  verified: number;
  pendingVerification: number;
  suspended: number;
  deleted: number;
}

export interface ProductStatistics {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export interface StoreProductStatistics {
  total: number;
  withCategories: number;
  withoutCategories: number;
  lastScraped: number;
}

export interface CategoryStatistics {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
  withoutProducts: number;
}

export interface SystemStatistics {
  users: UserStatistics;
  stores: StoreStatistics;
  products: ProductStatistics;
  storeProducts: StoreProductStatistics;
  categories: CategoryStatistics;
  lastUpdated: Date;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Obtiene estadísticas completas de usuarios
   */
  async getUserStatistics(): Promise<UserStatistics> {
    const [total, active, inactive, pendingVerification, suspended, deleted] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({
          where: { status: UserStatus.ACTIVE, isDeleted: false },
        }),
        this.userRepository.count({
          where: { status: UserStatus.INACTIVE, isDeleted: false },
        }),
        this.userRepository.count({
          where: { status: UserStatus.PENDING_VERIFICATION, isDeleted: false },
        }),
        this.userRepository.count({
          where: { status: UserStatus.SUSPENDED, isDeleted: false },
        }),
        this.userRepository.count({
          where: { isDeleted: true },
        }),
      ]);

    return {
      total,
      active,
      inactive,
      pendingVerification,
      suspended,
      deleted,
    };
  }

  /**
   * Obtiene estadísticas completas de tiendas
   */
  async getStoreStatistics(): Promise<StoreStatistics> {
    const [total, verified, pendingVerification, suspended] = await Promise.all(
      [
        this.storeRepository.count(),
        this.storeRepository.count({
          where: { isVerified: true },
        }),
        this.storeRepository.count({
          where: { isVerified: false },
        }),
        this.storeRepository.count({
          where: { status: StoreStatus.SUSPENDED },
        }),
      ],
    );

    return {
      total,
      verified,
      pendingVerification,
      suspended,
      deleted: 0, // Store entity doesn't have soft delete
    };
  }

  /**
   * Obtiene estadísticas completas de productos
   */
  async getProductStatistics(): Promise<ProductStatistics> {
    const [total, active, inactive] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      this.productRepository.count({
        where: { status: ProductStatus.INACTIVE },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      deleted: 0, // Product entity doesn't have soft delete
    };
  }

  /**
   * Obtiene estadísticas completas de store products
   */
  async getStoreProductStatistics(): Promise<StoreProductStatistics> {
    const [total, withCategories, withoutCategories, lastScraped] =
      await Promise.all([
        this.storeProductRepository.count(),
        this.storeProductRepository
          .createQueryBuilder('storeProduct')
          .leftJoin('storeProduct.categories', 'category')
          .where('category.id IS NOT NULL')
          .getCount(),
        this.storeProductRepository
          .createQueryBuilder('storeProduct')
          .leftJoin('storeProduct.categories', 'category')
          .where('category.id IS NULL')
          .getCount(),
        this.storeProductRepository
          .createQueryBuilder('storeProduct')
          .where('storeProduct.lastScraped IS NOT NULL')
          .getCount(),
      ]);

    return {
      total,
      withCategories,
      withoutCategories,
      lastScraped,
    };
  }

  /**
   * Obtiene estadísticas completas de categorías
   */
  async getCategoryStatistics(): Promise<CategoryStatistics> {
    const [total, active, inactive, withProducts, withoutProducts] =
      await Promise.all([
        this.categoryRepository.count(),
        this.categoryRepository.count({ where: { isActive: true } }),
        this.categoryRepository.count({ where: { isActive: false } }),
        this.categoryRepository
          .createQueryBuilder('category')
          .leftJoin('category.storeProducts', 'storeProduct')
          .where('storeProduct.id IS NOT NULL')
          .getCount(),
        this.categoryRepository
          .createQueryBuilder('category')
          .leftJoin('category.storeProducts', 'storeProduct')
          .where('storeProduct.id IS NULL')
          .getCount(),
      ]);

    return {
      total,
      active,
      inactive,
      withProducts,
      withoutProducts,
    };
  }

  /**
   * Obtiene estadísticas completas del sistema
   */
  async getSystemStatistics(): Promise<SystemStatistics> {
    const [users, stores, products, storeProducts, categories] =
      await Promise.all([
        this.getUserStatistics(),
        this.getStoreStatistics(),
        this.getProductStatistics(),
        this.getStoreProductStatistics(),
        this.getCategoryStatistics(),
      ]);

    return {
      users,
      stores,
      products,
      storeProducts,
      categories,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtiene estadísticas de usuarios por rol
   */
  async getUserStatisticsByRole(): Promise<Record<string, number>> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select('role.name', 'roleName')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('role.name')
      .getRawMany();

    const roleStats: Record<string, number> = {};
    result.forEach((item) => {
      roleStats[item.roleName || 'no_role'] = parseInt(item.count);
    });

    return roleStats;
  }

  /**
   * Obtiene estadísticas de tiendas por estado de verificación
   */
  async getStoreStatisticsByVerificationStatus(): Promise<
    Record<string, number>
  > {
    const result = await this.storeRepository
      .createQueryBuilder('store')
      .select('store.isVerified', 'isVerified')
      .addSelect('store.status', 'status')
      .addSelect('COUNT(store.id)', 'count')
      .groupBy('store.isVerified, store.status')
      .getRawMany();

    const statusStats: Record<string, number> = {
      verified: 0,
      pending: 0,
      suspended: 0,
    };

    result.forEach((item) => {
      if (item.isVerified && item.status !== StoreStatus.SUSPENDED) {
        statusStats.verified += parseInt(item.count);
      } else if (!item.isVerified && item.status !== StoreStatus.SUSPENDED) {
        statusStats.pending += parseInt(item.count);
      } else if (item.status === StoreStatus.SUSPENDED) {
        statusStats.suspended += parseInt(item.count);
      }
    });

    return statusStats;
  }

  /**
   * Obtiene estadísticas de productos por categoría
   */
  async getProductStatisticsByCategory(): Promise<Record<string, number>> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'categoryName')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('product.category')
      .getRawMany();

    const categoryStats: Record<string, number> = {};
    result.forEach((item) => {
      categoryStats[item.categoryName || 'no_category'] = parseInt(item.count);
    });

    return categoryStats;
  }

  /**
   * Obtiene estadísticas de store products por categoría
   */
  async getStoreProductStatisticsByCategory(): Promise<Record<string, number>> {
    const result = await this.storeProductRepository
      .createQueryBuilder('storeProduct')
      .leftJoin('storeProduct.categories', 'category')
      .select('category.name', 'categoryName')
      .addSelect('COUNT(storeProduct.id)', 'count')
      .groupBy('category.name')
      .getRawMany();

    const categoryStats: Record<string, number> = {};
    result.forEach((item) => {
      categoryStats[item.categoryName || 'no_category'] = parseInt(item.count);
    });

    return categoryStats;
  }

  /**
   * Obtiene estadísticas de categorías por estado
   */
  async getCategoryStatisticsByStatus(): Promise<Record<string, number>> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .select('category.isActive', 'isActive')
      .addSelect('COUNT(category.id)', 'count')
      .groupBy('category.isActive')
      .getRawMany();

    const statusStats: Record<string, number> = {
      active: 0,
      inactive: 0,
    };

    result.forEach((item) => {
      if (item.isActive) {
        statusStats.active = parseInt(item.count);
      } else {
        statusStats.inactive = parseInt(item.count);
      }
    });

    return statusStats;
  }
}
