import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index, Tree, TreeChildren, TreeParent } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('product_categories')
@Tree("closure-table")
@Index(['name'])
@Index(['slug'])
@Index(['isActive'])
@Index(['parentId'])
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Tree relations
  @TreeChildren()
  children: ProductCategory[];

  @TreeParent()
  parent: ProductCategory;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Virtual properties
  get hasChildren(): boolean {
    return this.children && this.children.length > 0;
  }

  get isParent(): boolean {
    return this.hasChildren;
  }

  get isChild(): boolean {
    return this.parentId !== null;
  }

  get isRoot(): boolean {
    return this.parentId === null;
  }

  get displayName(): string {
    return this.name;
  }

  get fullPath(): string {
    if (this.parent) {
      return `${this.parent.fullPath} > ${this.name}`;
    }
    return this.name;
  }

  get level(): number {
    if (this.parent) {
      return this.parent.level + 1;
    }
    return 0;
  }
}
