import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { StoreProduct } from './store-product.entity';

@Entity('base_products')
@Index(['name'])
@Index(['brand'])
@Index(['isActive'])
export class BaseProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  storeCount: number;

  @Column({ type: 'integer', default: 0 })
  totalVariants: number;

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

  @OneToMany(() => StoreProduct, (storeProduct) => storeProduct.baseProduct)
  storeProducts: StoreProduct[];

  get displayName(): string {
    return this.name || 'Unknown Product';
  }

  get fullName(): string {
    const parts = [this.brand, this.name, this.model].filter(Boolean);
    return parts.join(' ');
  }
}
