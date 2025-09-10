import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Category } from './category.entity';
import { Store } from '../../stores/entities/store.entity';
import { PhysicalLocation } from '../../physical-locations/entities/physical-location.entity';
import { BaseProduct } from './base-product.entity';

@Entity('store_products')
@Index(['lastScraped'])
@Index(['createdBy'])
@Index(['storeId'])
@Index(['storeProductId'], { unique: true, where: '"storeProductId" IS NOT NULL' })
@Index(['url'], { unique: true, where: 'url IS NOT NULL' })
@Index(['baseProductId'])
export class StoreProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'storeProductId' })
  storeProductId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'integer', nullable: true })
  price: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastScraped: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  storeId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  baseProductId: string | null;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relations

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToMany(() => Category, (category) => category.storeProducts)
  @JoinTable({
    name: 'store_product_categories',
    joinColumn: { name: 'storeProductId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => PhysicalLocation, (location) => location.storeProduct, {
    cascade: true,
  })
  physicalLocations: PhysicalLocation[];

  @ManyToOne(() => BaseProduct, (baseProduct) => baseProduct.storeProducts, { nullable: true })
  @JoinColumn({ name: 'baseProductId' })
  baseProduct: BaseProduct;

  // Virtual properties
  get displayName(): string {
    return this.name || 'Unknown Product';
  }
}
