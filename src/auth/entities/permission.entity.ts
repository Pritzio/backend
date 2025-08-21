import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

export enum PermissionType {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Role Management
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_LIST = 'role:list',
  ROLE_ASSIGN = 'role:assign',

  // Store Management
  STORE_CREATE = 'store:create',
  STORE_READ = 'store:read',
  STORE_UPDATE = 'store:update',
  STORE_DELETE = 'store:delete',
  STORE_LIST = 'store:list',
  STORE_MANAGE = 'store:manage',

  // Product Management
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_LIST = 'product:list',
  PRODUCT_MANAGE = 'product:manage',

  // Price Management
  PRICE_CREATE = 'price:create',
  PRICE_READ = 'price:read',
  PRICE_UPDATE = 'price:update',
  PRICE_DELETE = 'price:delete',
  PRICE_LIST = 'price:list',

  // Analytics & Reports
  ANALYTICS_READ = 'analytics:read',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
}

export enum PermissionCategory {
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  STORE_MANAGEMENT = 'store_management',
  PRODUCT_MANAGEMENT = 'product_management',
  PRICE_MANAGEMENT = 'price_management',
  ANALYTICS = 'analytics',
  SYSTEM_ADMIN = 'system_admin',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PermissionType,
    unique: true,
  })
  name: PermissionType;

  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category: PermissionCategory;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
