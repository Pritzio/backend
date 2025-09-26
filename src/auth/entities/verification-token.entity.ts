import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
}

@Entity('verification_tokens')
@Index(['token', 'type'], { unique: true })
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.EMAIL_VERIFICATION,
  })
  type: TokenType;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string | null;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}
