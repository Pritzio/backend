import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  PORTUGUESE = 'pt',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  MXN = 'MXN',
  COP = 'COP',
}

export enum TimeZone {
  UTC = 'UTC',
  EST = 'EST',
  CST = 'CST',
  MST = 'MST',
  PST = 'PST',
  GMT = 'GMT',
}

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.ENGLISH,
  })
  language: Language;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: TimeZone,
    default: TimeZone.UTC,
  })
  timeZone: TimeZone;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  pushNotifications: boolean;

  @Column({ default: false })
  smsNotifications: boolean;

  @Column({ default: true })
  inAppNotifications: boolean;

  @Column({ default: true })
  marketingEmails: boolean;

  @Column({ default: true })
  priceAlerts: boolean;

  @Column({ default: true })
  storeUpdates: boolean;

  @Column({ default: true })
  securityAlerts: boolean;

  @Column({ default: false })
  darkMode: boolean;

  @Column({ default: 'en' })
  dateFormat: string;

  @Column({ default: '12' })
  timeFormat: string;

  @Column({ default: true })
  locationServices: boolean;

  @Column({ default: true })
  analyticsTracking: boolean;

  @Column({ default: true })
  socialFeatures: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
