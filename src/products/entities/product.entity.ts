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

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock',
  COMING_SOON = 'coming_soon',
}

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription',
}

export enum ProductCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished',
  OPEN_BOX = 'open_box',
}

@Entity('products')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['status'])
@Index(['type'])
@Index(['category'])
@Index(['brand'])
@Index(['createdBy'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.NEW,
  })
  condition: ProductCondition;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weightUnit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dimensionUnit: string;

  @Column({ type: 'int', nullable: true })
  warrantyMonths: number;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Virtual properties
  get isActive(): boolean {
    return this.status === ProductStatus.ACTIVE;
  }

  get isAvailable(): boolean {
    return (
      this.status === ProductStatus.ACTIVE ||
      this.status === ProductStatus.COMING_SOON
    );
  }

  get isDiscontinued(): boolean {
    return this.status === ProductStatus.DISCONTINUED;
  }

  get displayName(): string {
    return this.name;
  }

  get fullCode(): string {
    return this.code;
  }

  get hasWarranty(): boolean {
    return !!(this.warrantyMonths && this.warrantyMonths > 0);
  }

  get hasDimensions(): boolean {
    return !!(this.length && this.width && this.height);
  }

  get hasWeight(): boolean {
    return !!(this.weight && this.weight > 0);
  }

  get isPhysical(): boolean {
    return this.type === ProductType.PHYSICAL;
  }

  get isDigital(): boolean {
    return this.type === ProductType.DIGITAL;
  }

  get isService(): boolean {
    return this.type === ProductType.SERVICE;
  }

  get isSubscription(): boolean {
    return this.type === ProductType.SUBSCRIPTION;
  }
}
