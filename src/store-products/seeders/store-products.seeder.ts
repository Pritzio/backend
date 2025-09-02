import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StoreProduct,
  StoreProductStatus,
  Availability,
  ScrapingStatus,
} from '../entities/store-product.entity';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';

@Injectable()
export class StoreProductsSeeder {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const stores = await this.storeRepository.find();
    const products = await this.productRepository.find();
    const users = await this.userRepository.find();

    if (stores.length === 0 || products.length === 0 || users.length === 0) {
      console.log(
        'Skipping store products seeding: No stores, products, or users found',
      );
      return;
    }

    const adminUser =
      users.find((user) =>
        user.roles.some(
          (role) =>
            role.name === RoleType.SUPER_ADMIN || role.name === RoleType.ADMIN,
        ),
      ) || users[0];

    const sampleStoreProducts = [
      {
        name: 'iPhone 15 Pro - Store Edition',
        description: 'Latest iPhone with exclusive store pricing',
        sku: 'IPH15P-STORE-001',
        url: 'https://store.com/iphone15pro',
        onlinePrice: 999.99,
        physicalPrice: 949.99,
        originalPrice: 1099.99,
        currency: 'USD',
        status: StoreProductStatus.ACTIVE,
        availability: Availability.IN_STOCK,
        scrapingStatus: ScrapingStatus.COMPLETED,
        stockQuantity: 25,
        minStockLevel: 5,
        isOnSale: true,
        saleStartDate: new Date('2024-01-01'),
        saleEndDate: new Date('2024-12-31'),
        lastScraped: new Date(),
        scrapingFrequency: 24,
        metadata: {
          color: 'Titanium',
          storage: '128GB',
          carrier: 'Unlocked',
        },
      },
      {
        name: 'Samsung Galaxy S24 - Premium',
        description: 'Flagship Android device with competitive pricing',
        sku: 'SAMS24-PREM-001',
        url: 'https://store.com/galaxys24',
        onlinePrice: 899.99,
        physicalPrice: 849.99,
        originalPrice: 999.99,
        currency: 'USD',
        status: StoreProductStatus.ACTIVE,
        availability: Availability.IN_STOCK,
        scrapingStatus: ScrapingStatus.COMPLETED,
        stockQuantity: 18,
        minStockLevel: 3,
        isOnSale: true,
        saleStartDate: new Date('2024-01-15'),
        saleEndDate: new Date('2024-06-30'),
        lastScraped: new Date(),
        scrapingFrequency: 12,
        metadata: {
          color: 'Phantom Black',
          storage: '256GB',
          carrier: 'Verizon',
        },
      },
      {
        name: 'MacBook Air M2 - Student Edition',
        description: 'Perfect laptop for students with educational discount',
        sku: 'MBA-M2-STU-001',
        url: 'https://store.com/macbook-air-m2',
        onlinePrice: 1099.99,
        physicalPrice: 1049.99,
        originalPrice: 1199.99,
        currency: 'USD',
        status: StoreProductStatus.ACTIVE,
        availability: Availability.LOW_STOCK,
        scrapingStatus: ScrapingStatus.COMPLETED,
        stockQuantity: 8,
        minStockLevel: 2,
        isOnSale: true,
        saleStartDate: new Date('2024-01-01'),
        saleEndDate: new Date('2024-08-31'),
        lastScraped: new Date(),
        scrapingFrequency: 24,
        metadata: {
          color: 'Space Gray',
          storage: '256GB',
          ram: '8GB',
        },
      },
      {
        name: 'AirPods Pro 2nd Gen',
        description: 'Premium wireless earbuds with noise cancellation',
        sku: 'APP2-PRO-001',
        url: 'https://store.com/airpods-pro-2',
        onlinePrice: 249.99,
        physicalPrice: 229.99,
        originalPrice: 279.99,
        currency: 'USD',
        status: StoreProductStatus.ACTIVE,
        availability: Availability.IN_STOCK,
        scrapingStatus: ScrapingStatus.COMPLETED,
        stockQuantity: 45,
        minStockLevel: 10,
        isOnSale: true,
        saleStartDate: new Date('2024-02-01'),
        saleEndDate: new Date('2024-05-31'),
        lastScraped: new Date(),
        scrapingFrequency: 12,
        metadata: {
          color: 'White',
          connectivity: 'Bluetooth 5.0',
          warranty: '1 year',
        },
      },
      {
        name: 'iPad Air 5th Gen',
        description: 'Versatile tablet for work and entertainment',
        sku: 'IPA5-AIR-001',
        url: 'https://store.com/ipad-air-5',
        onlinePrice: 599.99,
        physicalPrice: 549.99,
        originalPrice: 649.99,
        currency: 'USD',
        status: StoreProductStatus.ACTIVE,
        availability: Availability.OUT_OF_STOCK,
        scrapingStatus: ScrapingStatus.COMPLETED,
        stockQuantity: 0,
        minStockLevel: 5,
        isOnSale: true,
        saleStartDate: new Date('2024-01-01'),
        saleEndDate: new Date('2024-12-31'),
        lastScraped: new Date(),
        scrapingFrequency: 6,
        metadata: {
          color: 'Space Gray',
          storage: '64GB',
          cellular: false,
        },
      },
    ];

    for (const productData of sampleStoreProducts) {
      const store = stores[Math.floor(Math.random() * stores.length)];
      const product = products[Math.floor(Math.random() * products.length)];

      const existingStoreProduct = await this.storeProductRepository.findOne({
        where: {
          storeId: store.id,
          productId: product.id,
          sku: productData.sku,
        },
      });

      if (!existingStoreProduct) {
        const storeProduct = this.storeProductRepository.create({
          ...productData,
          storeId: store.id,
          productId: product.id,
          createdBy: adminUser.id,
        });

        await this.storeProductRepository.save(storeProduct);
        console.log(
          `Created store product: ${storeProduct.name} for store: ${store.name}`,
        );
      }
    }

    console.log('Store products seeding completed');
  }
}
