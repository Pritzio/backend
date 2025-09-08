import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { StoreProduct } from '../../store-products/entities/store-product.entity';
import { PhysicalLocation } from '../../physical-locations/entities/physical-location.entity';

export enum StoreType {
  ONLINE = 'online',
  PHYSICAL = 'physical',
  HYBRID = 'hybrid',
}

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum StoreCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  HOME_AND_GARDEN = 'home_and_garden',
  SPORTS = 'sports',
  BEAUTY = 'beauty',
  BOOKS = 'books',
  AUTOMOTIVE = 'automotive',
  FOOD_AND_BEVERAGES = 'food_and_beverages',
  HEALTH = 'health',
  TOYS = 'toys',
  OTHER = 'other',
}

@Entity('stores')
@Index(['name'], { unique: true })
@Index(['website'], { unique: true, where: 'website IS NOT NULL' })
@Index(['status'])
@Index(['type'])
@Index(['category'])
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({
    type: 'enum',
    enum: StoreType,
    default: StoreType.HYBRID,
  })
  type: StoreType;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING_VERIFICATION,
  })
  status: StoreStatus;

  @Column({
    type: 'enum',
    enum: StoreCategory,
    default: StoreCategory.OTHER,
  })
  category: StoreCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => StoreProduct, (storeProduct) => storeProduct.store, {
    cascade: true,
  })
  storeProducts: StoreProduct[];

  @OneToMany(() => PhysicalLocation, (location) => location.store, {
    cascade: true,
  })
  physicalLocations: PhysicalLocation[];

  // Virtual properties
  get isActive(): boolean {
    return this.status === StoreStatus.ACTIVE;
  }

  get hasPhysicalLocations(): boolean {
    return this.type === StoreType.PHYSICAL || this.type === StoreType.HYBRID;
  }

  get isOnlineOnly(): boolean {
    return this.type === StoreType.ONLINE;
  }

  get displayName(): string {
    return this.name;
  }

  get storeTypeDisplay(): string {
    return this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }

  get statusDisplay(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
}
