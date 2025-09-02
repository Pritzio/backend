import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Product,
  ProductStatus,
  ProductType,
  ProductCondition,
} from '../entities/product.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductBrand } from '../entities/product-brand.entity';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';

@Injectable()
export class ProductsSeeder {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductBrand)
    private readonly brandRepository: Repository<ProductBrand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const users = await this.userRepository.find();

    if (users.length === 0) {
      console.log('Skipping products seeding: No users found');
      return;
    }

    const adminUser =
      users.find((user) =>
        user.roles.some(
          (role) =>
            role.name === RoleType.SUPER_ADMIN || role.name === RoleType.ADMIN,
        ),
      ) || users[0];

    // Create categories first
    const categories = await this.createCategories(adminUser.id);

    // Create brands
    const brands = await this.createBrands(adminUser.id);

    // Create products
    await this.createProducts(adminUser.id, categories, brands);

    console.log('Products seeding completed');
  }

  private async createCategories(
    adminUserId: string,
  ): Promise<ProductCategory[]> {
    const categoriesData = [
      {
        name: 'Smartphones',
        description: 'Mobile phones and communication devices',
        slug: 'smartphones',
        parentId: undefined,
        level: 1,
        sortOrder: 1,
        isActive: true,
        metadata: { icon: 'phone', color: '#007AFF' },
      },
      {
        name: 'Laptops',
        description: 'Portable computers and notebooks',
        slug: 'laptops',
        parentId: undefined,
        level: 1,
        sortOrder: 2,
        isActive: true,
        metadata: { icon: 'laptop', color: '#34C759' },
      },
      {
        name: 'Tablets',
        description: 'Portable touchscreen devices',
        slug: 'tablets',
        parentId: undefined,
        level: 1,
        sortOrder: 3,
        isActive: true,
        metadata: { icon: 'tablet', color: '#FF9500' },
      },
      {
        name: 'Audio',
        description: 'Headphones, speakers, and audio equipment',
        slug: 'audio',
        parentId: undefined,
        level: 1,
        sortOrder: 4,
        isActive: true,
        metadata: { icon: 'headphones', color: '#AF52DE' },
      },
      {
        name: 'Gaming',
        description: 'Gaming consoles, accessories, and games',
        slug: 'gaming',
        parentId: undefined,
        level: 1,
        sortOrder: 5,
        isActive: true,
        metadata: { icon: 'game-controller', color: '#FF3B30' },
      },
    ];

    const categories: ProductCategory[] = [];

    for (const categoryData of categoriesData) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: categoryData.slug },
      });

      if (!existingCategory) {
        const category = this.categoryRepository.create({
          ...categoryData,
          createdBy: adminUserId,
        });

        const savedCategory = await this.categoryRepository.save(category);
        categories.push(savedCategory);
        console.log(`Created category: ${category.name}`);
      } else {
        categories.push(existingCategory);
      }
    }

    return categories;
  }

  private async createBrands(adminUserId: string): Promise<ProductBrand[]> {
    const brandsData = [
      {
        name: 'Apple',
        slug: 'apple',
        description: 'Innovative technology company',
        logo: 'https://store.com/brands/apple-logo.png',
        website: 'https://www.apple.com',
        country: 'United States',
        founded: '1976',
        ceo: 'Tim Cook',
        employeeCount: 164000,
        annualRevenue: 394328000000,
        socialMedia: {
          twitter: '@Apple',
          facebook: 'Apple',
          instagram: 'apple',
        },
        metadata: { color: '#000000', premium: true },
      },
      {
        name: 'Samsung',
        slug: 'samsung',
        description: 'Global electronics leader',
        logo: 'https://store.com/brands/samsung-logo.png',
        website: 'https://www.samsung.com',
        country: 'South Korea',
        founded: '1938',
        ceo: 'Lee Jae-yong',
        employeeCount: 267000,
        annualRevenue: 279600000000,
        socialMedia: {
          twitter: '@Samsung',
          facebook: 'Samsung',
          instagram: 'samsung',
        },
        metadata: { color: '#1428A0', premium: true },
      },
      {
        name: 'Microsoft',
        slug: 'microsoft',
        description: 'Software and hardware solutions',
        logo: 'https://store.com/brands/microsoft-logo.png',
        website: 'https://www.microsoft.com',
        country: 'United States',
        founded: '1975',
        ceo: 'Satya Nadella',
        employeeCount: 221000,
        annualRevenue: 198270000000,
        socialMedia: {
          twitter: '@Microsoft',
          facebook: 'Microsoft',
          instagram: 'microsoft',
        },
        metadata: { color: '#00A4EF', premium: true },
      },
      {
        name: 'Sony',
        slug: 'sony',
        description: 'Entertainment and technology company',
        logo: 'https://store.com/brands/sony-logo.png',
        website: 'https://www.sony.com',
        country: 'Japan',
        founded: '1946',
        ceo: 'Kenichiro Yoshida',
        employeeCount: 109700,
        annualRevenue: 84763000000,
        socialMedia: {
          twitter: '@Sony',
          facebook: 'Sony',
          instagram: 'sony',
        },
        metadata: { color: '#000000', premium: true },
      },
      {
        name: 'LG',
        slug: 'lg',
        description: 'Electronics and home appliances',
        logo: 'https://store.com/brands/lg-logo.png',
        website: 'https://www.lg.com',
        country: 'South Korea',
        founded: '1947',
        ceo: 'Koo Kwang-mo',
        employeeCount: 75000,
        annualRevenue: 63000000000,
        socialMedia: {
          twitter: '@LGUS',
          facebook: 'LG',
          instagram: 'lg',
        },
        metadata: { color: '#A50034', premium: false },
      },
    ];

    const brands: ProductBrand[] = [];

    for (const brandData of brandsData) {
      const existingBrand = await this.brandRepository.findOne({
        where: { slug: brandData.slug },
      });

      if (!existingBrand) {
        const brand = this.brandRepository.create({
          ...brandData,
          createdBy: adminUserId,
        });

        const savedBrand = await this.brandRepository.save(brand);
        brands.push(savedBrand);
        console.log(`Created brand: ${brand.name}`);
      } else {
        brands.push(existingBrand);
      }
    }

    return brands;
  }

  private async createProducts(
    adminUserId: string,
    categories: ProductCategory[],
    brands: ProductBrand[],
  ): Promise<void> {
    const productsData = [
      {
        name: 'iPhone 15 Pro',
        code: 'IPH15P-001',
        description: 'Latest iPhone with A17 Pro chip and titanium design',
        categoryId: categories.find((c) => c.slug === 'smartphones')?.id,
        brandId: brands.find((b) => b.slug === 'apple')?.id,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        condition: ProductCondition.NEW,
        length: 146.7,
        width: 71.5,
        height: 8.25,
        weight: 187,
        warrantyMonths: 12,
        specifications: {
          screen: '6.1 inch Super Retina XDR',
          processor: 'A17 Pro chip',
          storage: '128GB',
          camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
          battery: 'Up to 23 hours video playback',
        },
        features: [
          'Titanium design',
          'Action button',
          'USB-C connector',
          'Pro camera system',
          'A17 Pro chip',
        ],
        tags: ['iPhone', 'Smartphone', 'Apple', '5G', 'Pro'],
        metadata: {
          releaseDate: '2024-09-22',
          color: 'Natural Titanium',
          carrier: 'Unlocked',
        },
      },
      {
        name: 'MacBook Air M2',
        code: 'MBA-M2-001',
        description: 'Ultra-thin laptop with M2 chip and all-day battery life',
        categoryId: categories.find((c) => c.slug === 'laptops')?.id,
        brandId: brands.find((b) => b.slug === 'apple')?.id,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        condition: ProductCondition.NEW,
        length: 304.1,
        width: 215.0,
        height: 11.3,
        weight: 1247,
        warrantyMonths: 12,
        specifications: {
          screen: '13.6 inch Liquid Retina display',
          processor: 'M2 chip',
          memory: '8GB unified memory',
          storage: '256GB SSD',
          battery: 'Up to 18 hours',
        },
        features: [
          'M2 chip',
          'Liquid Retina display',
          'All-day battery life',
          'Fanless design',
          'MagSafe charging',
        ],
        tags: ['MacBook', 'Laptop', 'Apple', 'M2', 'Ultrabook'],
        metadata: {
          releaseDate: '2022-07-15',
          color: 'Space Gray',
          keyboard: 'Backlit Magic Keyboard',
        },
      },
      {
        name: 'Samsung Galaxy S24',
        code: 'SAMS24-001',
        description: 'Flagship Android smartphone with AI features',
        categoryId: categories.find((c) => c.slug === 'smartphones')?.id,
        brandId: brands.find((b) => b.slug === 'samsung')?.id,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        condition: ProductCondition.NEW,
        length: 147.0,
        width: 70.6,
        height: 7.6,
        weight: 167,
        warrantyMonths: 12,
        specifications: {
          screen: '6.2 inch Dynamic AMOLED 2X',
          processor: 'Snapdragon 8 Gen 3',
          storage: '256GB',
          camera: '50MP Main + 12MP Ultra Wide + 10MP Telephoto',
          battery: '4000mAh',
        },
        features: [
          'AI-powered features',
          'Dynamic AMOLED display',
          'Pro-grade camera',
          'Fast charging',
          '5G connectivity',
        ],
        tags: ['Galaxy', 'Smartphone', 'Samsung', '5G', 'AI'],
        metadata: {
          releaseDate: '2024-01-17',
          color: 'Phantom Black',
          carrier: 'Verizon',
        },
      },
      {
        name: 'iPad Air 5th Generation',
        code: 'IPA5-001',
        description: 'Powerful tablet with M1 chip and all-screen design',
        categoryId: categories.find((c) => c.slug === 'tablets')?.id,
        brandId: brands.find((b) => b.slug === 'apple')?.id,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        condition: ProductCondition.NEW,
        length: 247.6,
        width: 178.5,
        height: 6.1,
        weight: 458,
        warrantyMonths: 12,
        specifications: {
          screen: '10.9 inch Liquid Retina display',
          processor: 'M1 chip',
          storage: '64GB',
          camera: '12MP Ultra Wide front camera',
          battery: 'Up to 10 hours',
        },
        features: [
          'M1 chip',
          'Liquid Retina display',
          'Touch ID',
          'Apple Pencil support',
          '5G cellular option',
        ],
        tags: ['iPad', 'Tablet', 'Apple', 'M1', 'Touch ID'],
        metadata: {
          releaseDate: '2022-03-18',
          color: 'Space Gray',
          cellular: false,
        },
      },
      {
        name: 'AirPods Pro 2nd Generation',
        code: 'APP2-001',
        description: 'Premium wireless earbuds with active noise cancellation',
        categoryId: categories.find((c) => c.slug === 'audio')?.id,
        brandId: brands.find((b) => b.slug === 'apple')?.id,
        type: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        condition: ProductCondition.NEW,
        length: 30.9,
        width: 21.8,
        height: 24.0,
        weight: 5.3,
        warrantyMonths: 12,
        specifications: {
          connectivity: 'Bluetooth 5.0',
          battery: 'Up to 6 hours listening time',
          charging: 'MagSafe charging case',
          features: 'Active noise cancellation',
        },
        features: [
          'Active noise cancellation',
          'Adaptive transparency',
          'Personalized spatial audio',
          'MagSafe charging case',
          'Sweat and water resistant',
        ],
        tags: [
          'AirPods',
          'Headphones',
          'Apple',
          'Wireless',
          'Noise Cancellation',
        ],
        metadata: {
          releaseDate: '2022-09-23',
          color: 'White',
          compatibility: 'iPhone, iPad, Mac, Apple Watch',
        },
      },
    ];

    for (const productData of productsData) {
      const existingProduct = await this.productRepository.findOne({
        where: { code: productData.code },
      });

      if (!existingProduct) {
        const product = this.productRepository.create({
          ...productData,
          createdBy: adminUserId,
        });

        await this.productRepository.save(product);
        console.log(`Created product: ${product.name}`);
      }
    }
  }
}
