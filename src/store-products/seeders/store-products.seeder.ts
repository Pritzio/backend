import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreProduct } from '../entities/store-product.entity';

import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';

@Injectable()
export class StoreProductsSeeder {
  constructor(
    @InjectRepository(StoreProduct)
    private readonly storeProductRepository: Repository<StoreProduct>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    console.log('🌱 Starting StoreProducts seeding...');

    // Get admin user
    const adminUser = await this.userRepository.findOne({
      where: { roles: { name: RoleType.ADMIN } },
      relations: ['roles'],
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Skipping store products seeding.');
      return;
    }

    const sampleStoreProducts = [
      {
        name: 'Habas Congeladas 500 g',
        description: 'Habas congeladas de alta calidad',
        url: 'https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p',
        sku: 'HABAS-500G-001',
        storeProductId: '75413',
        image:
          'https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg',
        metadata: {
          brand: 'Cuisine & Co',
          rating: 5,
          ratingText: '5.0',
          categories: ['Otras Verduras'],
        },
        lastScraped: new Date(),
        notes: 'Producto de ejemplo para scraping',
        createdBy: adminUser.id,
      },
      {
        name: 'Arroz Integral 1kg',
        description: 'Arroz integral de grano largo',
        url: 'https://jumbo.cl/arroz-integral-1kg',
        sku: 'ARROZ-INT-1KG-001',
        storeProductId: '75414',
        image:
          'https://jumbocl.vteximg.com.br/arquivos/ids/363134-250-250/arroz-integral-1kg.jpg',
        metadata: {
          brand: 'Granos Premium',
          rating: 4,
          ratingText: '4.0',
          categories: ['Granos y Cereales'],
        },
        lastScraped: new Date(),
        notes: 'Producto de ejemplo para scraping',
        createdBy: adminUser.id,
      },
    ];

    for (const storeProductData of sampleStoreProducts) {
      // Check if store product already exists
      const existingStoreProduct = await this.storeProductRepository.findOne({
        where: { sku: storeProductData.sku },
      });

      if (!existingStoreProduct) {
        const storeProduct =
          this.storeProductRepository.create(storeProductData);
        await this.storeProductRepository.save(storeProduct);
        console.log(`✅ Created store product: ${storeProductData.name}`);
      } else {
        console.log(
          `⏭️  Store product already exists: ${storeProductData.name}`,
        );
      }
    }

    console.log('✅ StoreProducts seeding completed!');
  }
}
