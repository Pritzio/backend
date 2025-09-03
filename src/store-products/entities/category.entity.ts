import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { StoreProduct } from './store-product.entity';

@Entity('categories')
@Index(['name'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string; // Para UI - color hexadecimal

  @Column({ type: 'varchar', length: 200, nullable: true })
  icon: string; // Para UI - nombre del icono

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  productCount: number; // Contador de productos asociados

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => StoreProduct, (storeProduct) => storeProduct.categories)
  @JoinTable({
    name: 'store_product_categories',
    joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'storeProductId', referencedColumnName: 'id' },
  })
  storeProducts: StoreProduct[];

  // Virtual properties
  get displayName(): string {
    return this.name || 'Unknown Category';
  }
}
