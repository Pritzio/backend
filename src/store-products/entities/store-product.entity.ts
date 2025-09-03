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



@Entity('store_products')
@Index(['lastScraped'])
@Index(['createdBy'])
@Index(['storeProductId'], { unique: true, where: 'storeProductId IS NOT NULL' })
@Index(['url'], { unique: true, where: 'url IS NOT NULL' })
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  storeProductId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastScraped: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string;

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

  @ManyToMany(() => Category, (category) => category.storeProducts)
  @JoinTable({
    name: 'store_product_categories',
    joinColumn: { name: 'storeProductId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];



  // Virtual properties
  get displayName(): string {
    return this.name || 'Unknown Product';
  }
}
