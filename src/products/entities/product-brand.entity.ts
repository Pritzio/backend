import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('product_brands')
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
@Index(['isActive'])
@Index(['country'])
export class ProductBrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  founded: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  headquarters: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ceo: string;

  @Column({ type: 'int', nullable: true })
  employeeCount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  certifications: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

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
  get displayName(): string {
    return this.name;
  }

  get isEstablished(): boolean {
    return !!(this.founded && this.founded !== '');
  }

  get hasWebsite(): boolean {
    return !!(this.website && this.website !== '');
  }

  get hasLogo(): boolean {
    return !!(this.logo && this.logo !== '');
  }

  get hasSocialMedia(): boolean {
    return this.socialMedia && Object.keys(this.socialMedia).length > 0;
  }

  get hasCertifications(): boolean {
    return this.certifications && this.certifications.length > 0;
  }

  get isLargeCompany(): boolean {
    return !!(this.employeeCount && this.employeeCount > 1000);
  }

  get isMediumCompany(): boolean {
    return !!(this.employeeCount && this.employeeCount > 100 && this.employeeCount <= 1000);
  }

  get isSmallCompany(): boolean {
    return !!(this.employeeCount && this.employeeCount <= 100);
  }
}
