import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../auth/entities/user.entity';

export enum StoreProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  COMING_SOON = 'coming_soon',
  ERROR = 'error',
}

export enum Availability {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  PRE_ORDER = 'pre_order',
  BACKORDER = 'backorder',
}

export enum ScrapingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled',
}

@Entity('store_products')
@Index(['storeId', 'productId'], { unique: true })
@Index(['storeId'])
@Index(['productId'])
@Index(['status'])
@Index(['availability'])
@Index(['scrapingStatus'])
@Index(['lastScraped'])
@Index(['createdBy'])
export class StoreProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  storeProductId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  onlinePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physicalPrice: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: Availability,
    default: Availability.IN_STOCK,
  })
  availability: Availability;

  @Column({
    type: 'enum',
    enum: StoreProductStatus,
    default: StoreProductStatus.ACTIVE,
  })
  status: StoreProductStatus;

  @Column({
    type: 'enum',
    enum: ScrapingStatus,
    default: ScrapingStatus.PENDING,
  })
  scrapingStatus: ScrapingStatus;

  @Column({ type: 'int', nullable: true })
  stockQuantity: number;

  @Column({ type: 'int', nullable: true })
  minStockLevel: number;

  @Column({ type: 'boolean', default: false })
  isOnSale: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ type: 'date', nullable: true })
  saleEndDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastScraped: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextScrapingDate: Date;

  @Column({ type: 'int', default: 24 })
  scrapingIntervalHours: number;

  @Column({ type: 'jsonb', nullable: true })
  scrapingConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  scrapingHistory: Array<{
    timestamp: Date;
    status: ScrapingStatus;
    price?: number;
    availability?: Availability;
    stockQuantity?: number;
    error?: string;
    responseTime?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  priceHistory: Array<{
    timestamp: Date;
    price: number;
    currency: string;
    type: 'online' | 'physical';
    source: 'scraping' | 'manual';
  }>;

  @Column({ type: 'jsonb', nullable: true })
  availabilityHistory: Array<{
    timestamp: Date;
    availability: Availability;
    stockQuantity?: number;
    source: 'scraping' | 'manual';
  }>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier: User;

  // Virtual properties
  get isActive(): boolean {
    return this.status === StoreProductStatus.ACTIVE;
  }

  get hasOnlinePrice(): boolean {
    return !!(this.onlinePrice && this.onlinePrice > 0);
  }

  get hasPhysicalPrice(): boolean {
    return !!(this.physicalPrice && this.physicalPrice > 0);
  }

  get hasDiscount(): boolean {
    return !!(
      this.isOnSale &&
      this.originalPrice &&
      this.onlinePrice &&
      this.originalPrice > this.onlinePrice
    );
  }

  get discountAmount(): number {
    if (this.hasDiscount) {
      return this.originalPrice - this.onlinePrice;
    }
    return 0;
  }

  get calculatedDiscountPercentage(): number {
    if (this.hasDiscount) {
      return (
        ((this.originalPrice - this.onlinePrice) / this.originalPrice) * 100
      );
    }
    return 0;
  }

  get isLowStock(): boolean {
    return !!(
      this.stockQuantity &&
      this.minStockLevel &&
      this.stockQuantity <= this.minStockLevel
    );
  }

  get isOutOfStock(): boolean {
    return (
      this.availability === Availability.OUT_OF_STOCK ||
      this.stockQuantity === 0
    );
  }

  get needsScraping(): boolean {
    if (!this.lastScraped) return true;
    const hoursSinceLastScraping =
      (Date.now() - this.lastScraped.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastScraping >= this.scrapingIntervalHours;
  }

  get scrapingOverdue(): boolean {
    if (!this.lastScraped) return true;
    const hoursSinceLastScraping =
      (Date.now() - this.lastScraped.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastScraping > this.scrapingIntervalHours * 1.5;
  }

  get displayName(): string {
    return this.name || this.product?.name || 'Unknown Product';
  }

  get bestPrice(): number {
    if (this.hasOnlinePrice && this.hasPhysicalPrice) {
      return Math.min(this.onlinePrice, this.physicalPrice);
    }
    return this.onlinePrice || this.physicalPrice || 0;
  }

  get priceType(): 'online' | 'physical' | 'both' | 'none' {
    if (this.hasOnlinePrice && this.hasPhysicalPrice) return 'both';
    if (this.hasOnlinePrice) return 'online';
    if (this.hasPhysicalPrice) return 'physical';
    return 'none';
  }

  get lastPriceChange(): Date | null {
    if (!this.priceHistory || this.priceHistory.length === 0) return null;
    return this.priceHistory[this.priceHistory.length - 1]?.timestamp || null;
  }

  get priceVolatility(): number {
    if (!this.priceHistory || this.priceHistory.length < 2) return 0;

    const prices = this.priceHistory.map((p) => p.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      prices.length;

    return Math.sqrt(variance);
  }
}
