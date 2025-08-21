import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { StoreProduct } from '../../store-products/entities/store-product.entity';
import { User } from '../../auth/entities/user.entity';

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  PERMANENTLY_CLOSED = 'permanently_closed',
  UNDER_CONSTRUCTION = 'under_construction'
}

export enum LocationType {
  STORE = 'store',
  WAREHOUSE = 'warehouse',
  DISTRIBUTION_CENTER = 'distribution_center',
  PICKUP_POINT = 'pickup_point',
  SERVICE_CENTER = 'service_center',
  SHOWROOM = 'showroom'
}

@Entity('physical_locations')
@Index(['storeId'])
@Index(['status'])
@Index(['type'])
@Index(['city'])
@Index(['state'])
@Index(['country'])
@Index(['postalCode'])
@Index(['latitude', 'longitude'])
@Index(['createdBy'])
export class PhysicalLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.STORE
  })
  type: LocationType;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE
  })
  status: LocationStatus;

  @Column({ type: 'varchar', length: 200 })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address2: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, {
    open: string;
    close: string;
    isOpen: boolean;
    specialHours?: string;
  }>;

  @Column({ type: 'boolean', default: true })
  isOpen24Hours: boolean;

  @Column({ type: 'boolean', default: false })
  hasParking: boolean;

  @Column({ type: 'boolean', default: false })
  hasWheelchairAccess: boolean;

  @Column({ type: 'boolean', default: false })
  hasPublicTransport: boolean;

  @Column({ type: 'jsonb', nullable: true })
  amenities: string[];

  @Column({ type: 'jsonb', nullable: true })
  services: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physicalPrice: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  priceAdjustments: Record<string, {
    reason: string;
    adjustment: number;
    percentage: boolean;
    validFrom: Date;
    validTo?: Date;
  }>;

  @Column({ type: 'int', nullable: true })
  maxCapacity: number;

  @Column({ type: 'int', nullable: true })
  currentCapacity: number;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };

  @Column({ type: 'jsonb', nullable: true })
  specialHours: Array<{
    date: string;
    open: string;
    close: string;
    isOpen: boolean;
    reason: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  holidays: Array<{
    date: string;
    name: string;
    isOpen: boolean;
    openHours?: string;
    closeHours?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Store products will be linked through storeId

  // Virtual properties
  get isActive(): boolean {
    return this.status === LocationStatus.ACTIVE;
  }

  get isOpen(): boolean {
    if (this.isOpen24Hours) return true;
    
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3);
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (this.operatingHours && this.operatingHours[dayOfWeek]) {
      const dayHours = this.operatingHours[dayOfWeek];
      if (!dayHours.isOpen) return false;
      
      return currentTime >= dayHours.open && currentTime <= dayHours.close;
    }
    
    return false;
  }

  get coordinates(): { lat: number; lng: number } {
    return {
      lat: this.latitude,
      lng: this.longitude
    };
  }

  get fullAddress(): string {
    const parts = [this.address];
    if (this.address2) parts.push(this.address2);
    parts.push(this.city, this.state, this.postalCode, this.country);
    return parts.filter(Boolean).join(', ');
  }

  get shortAddress(): string {
    return `${this.city}, ${this.state}`;
  }

  get hasSpecialHours(): boolean {
    return this.specialHours && this.specialHours.length > 0;
  }

  get hasHolidays(): boolean {
    return this.holidays && this.holidays.length > 0;
  }

  get hasPriceAdjustments(): boolean {
    return this.priceAdjustments && Object.keys(this.priceAdjustments).length > 0;
  }

  get isAtCapacity(): boolean {
    return !!(this.maxCapacity && this.currentCapacity && this.currentCapacity >= this.maxCapacity);
  }

  get capacityPercentage(): number {
    if (!this.maxCapacity || !this.currentCapacity) return 0;
    return (this.currentCapacity / this.maxCapacity) * 100;
  }

  get isLowCapacity(): boolean {
    return this.capacityPercentage > 80;
  }

  get hasAmenities(): boolean {
    return this.amenities && this.amenities.length > 0;
  }

  get hasServices(): boolean {
    return this.services && this.services.length > 0;
  }

  // Distance calculation methods
  calculateDistance(lat: number, lng: number): number {
    return this.haversineDistance(this.latitude, this.longitude, lat, lng);
  }

  calculateDistanceFromLocation(location: PhysicalLocation): number {
    return this.calculateDistance(location.latitude, location.longitude);
  }

  isWithinRadius(lat: number, lng: number, radiusKm: number): boolean {
    const distance = this.calculateDistance(lat, lng);
    return distance <= radiusKm;
  }

  getEstimatedTravelTime(lat: number, lng: number, averageSpeedKmH: number = 30): number {
    const distance = this.calculateDistance(lat, lng);
    return (distance / averageSpeedKmH) * 60; // Return minutes
  }

  // Private helper methods
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Business hours methods
  getTodayHours(): { open: string; close: string; isOpen: boolean } | null {
    if (!this.operatingHours) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3);
    return this.operatingHours[today] || null;
  }

  getNextOpenDay(): { day: string; hours: { open: string; close: string; isOpen: boolean } } | null {
    if (!this.operatingHours) return null;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = new Date().getDay();
    
    for (let i = 1; i <= 7; i++) {
      const dayIndex = (today + i) % 7;
      const dayName = days[dayIndex];
      const dayHours = this.operatingHours[dayName];
      
      if (dayHours && dayHours.isOpen) {
        return { day: dayName, hours: dayHours };
      }
    }
    
    return null;
  }

  // Price calculation methods
  getAdjustedPrice(basePrice: number): number {
    if (!this.hasPriceAdjustments) return basePrice;
    
    let adjustedPrice = basePrice;
    const now = new Date();
    
    for (const adjustment of Object.values(this.priceAdjustments)) {
      if (now >= adjustment.validFrom && (!adjustment.validTo || now <= adjustment.validTo)) {
        if (adjustment.percentage) {
          adjustedPrice += (basePrice * adjustment.adjustment) / 100;
        } else {
          adjustedPrice += adjustment.adjustment;
        }
      }
    }
    
    return Math.max(0, adjustedPrice);
  }

  getLocationPrice(productPrice: number): number {
    if (this.physicalPrice !== null && this.physicalPrice !== undefined) {
      return this.physicalPrice;
    }
    
    return this.getAdjustedPrice(productPrice);
  }
}
