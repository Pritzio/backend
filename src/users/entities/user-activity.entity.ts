import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  PREFERENCES_UPDATE = 'preferences_update',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  LOCATION_UPDATE = 'location_update',
  DEVICE_ADD = 'device_add',
  DEVICE_REMOVE = 'device_remove',
  SECURITY_ALERT = 'security_alert',
  ACCOUNT_LOCK = 'account_lock',
  ACCOUNT_UNLOCK = 'account_unlock',
  PRIVACY_UPDATE = 'privacy_update',
  NOTIFICATION_UPDATE = 'notification_update'
}

export enum ActivityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SECURITY = 'security'
}

@Entity('user_activities')
@Index(['userId', 'createdAt'])
@Index(['activityType', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: ActivityType 
  })
  activityType: ActivityType;

  @Column({ 
    type: 'enum', 
    enum: ActivityLevel, 
    default: ActivityLevel.INFO 
  })
  activityLevel: ActivityLevel;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ nullable: true, length: 1000 })
  details: string;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 500 })
  userAgent: string;

  @Column({ nullable: true, length: 100 })
  deviceId: string;

  @Column({ nullable: true, length: 100 })
  location: string;

  @Column({ nullable: true, type: 'json' })
  metadata: Record<string, any>;

  @Column({ nullable: true, length: 100 })
  sessionId: string;

  @Column({ default: false })
  isSuccessful: boolean;

  @Column({ nullable: true, length: 500 })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
