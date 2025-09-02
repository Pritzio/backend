import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { PhysicalLocation } from './physical-location.entity';

export enum Availability {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  LIMITED = 'limited',
  PRE_ORDER = 'pre_order',
  DISCONTINUED = 'discontinued',
}

export enum StoreProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('store_products')
@Index(['storeId'])
@Index(['productId'])
@Index(['status'])
@Index(['availability'])
@Index(['lastScraped'])
export class StoreProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
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
    default: StoreProductStatus.PENDING_VERIFICATION,
  })
  status: StoreProductStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastScraped: Date;

  @Column({ type: 'jsonb', nullable: true })
  scrapingData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.storeProducts, { nullable: false })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => PhysicalLocation, (location) => location.storeProduct, {
    cascade: true,
  })
  physicalLocations: PhysicalLocation[];

  // Virtual properties
  get isActive(): boolean {
    return this.status === StoreProductStatus.ACTIVE;
  }

  get hasPhysicalPricing(): boolean {
    return this.physicalPrice !== null;
  }

  get priceDifference(): number | null {
    if (this.physicalPrice && this.onlinePrice) {
      return this.physicalPrice - this.onlinePrice;
    }
    return null;
  }

  get isInStock(): boolean {
    return (
      this.availability === Availability.IN_STOCK ||
      this.availability === Availability.LIMITED
    );
  }

  get displayOnlinePrice(): string {
    return `${this.currency} ${this.onlinePrice.toFixed(2)}`;
  }

  get displayPhysicalPrice(): string {
    if (this.physicalPrice) {
      return `${this.currency} ${this.physicalPrice.toFixed(2)}`;
    }
    return 'Not available';
  }

  get needsScraping(): boolean {
    if (!this.lastScraped) return true;
    const hoursSinceLastScrape =
      (Date.now() - this.lastScraped.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastScrape > 24; // Scrape every 24 hours
  }
}
