import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { StoreProduct } from './store-product.entity';

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  PERMANENTLY_CLOSED = 'permanently_closed',
}

@Entity('physical_locations')
@Index(['storeId'])
@Index(['city'])
@Index(['state'])
@Index(['country'])
@Index(['status'])
@Index(['latitude', 'longitude'])
export class PhysicalLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  storeProductId: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  zipCode: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hours: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physicalPrice: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE,
  })
  status: LocationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, (store) => store.physicalLocations, {
    nullable: false,
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(
    () => StoreProduct,
    (storeProduct) => storeProduct.physicalLocations,
    { nullable: true },
  )
  @JoinColumn({ name: 'storeProductId' })
  storeProduct: StoreProduct;

  // Virtual properties
  get isActive(): boolean {
    return this.status === LocationStatus.ACTIVE;
  }

  get fullAddress(): string {
    return `${this.address}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }

  get coordinates(): { lat: number; lng: number } {
    return { lat: this.latitude, lng: this.longitude };
  }

  get hasProductSpecificPricing(): boolean {
    return this.storeProductId !== null && this.physicalPrice !== null;
  }

  get displayPrice(): string {
    if (this.physicalPrice) {
      return `${this.currency} ${this.physicalPrice.toFixed(2)}`;
    }
    return 'Price not available';
  }
}
