import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../auth/entities/user.entity';
import { Store, StoreStatus } from '../../stores/entities/store.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';

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

export interface SystemStatistics {
  users: UserStatistics;
  stores: StoreStatistics;
  products: ProductStatistics;
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
   * Obtiene estadísticas completas del sistema
   */
  async getSystemStatistics(): Promise<SystemStatistics> {
    const [users, stores, products] = await Promise.all([
      this.getUserStatistics(),
      this.getStoreStatistics(),
      this.getProductStatistics(),
    ]);

    return {
      users,
      stores,
      products,
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
}
