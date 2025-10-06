import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VerificationToken,
  TokenType,
} from '../entities/verification-token.entity';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class VerificationTokenService {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
  ) {}

  async generateEmailVerificationToken(user: User): Promise<VerificationToken> {
    // Delete any existing email verification tokens for this user
    await this.verificationTokenRepository.delete({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const verificationToken = this.verificationTokenRepository.create({
      token,
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt,
      userId: user.id,
    });

    return this.verificationTokenRepository.save(verificationToken);
  }

  async generatePasswordResetToken(user: User): Promise<VerificationToken> {
    // Delete any existing password reset tokens for this user
    await this.verificationTokenRepository.delete({
      userId: user.id,
      type: TokenType.PASSWORD_RESET,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    const verificationToken = this.verificationTokenRepository.create({
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt,
      userId: user.id,
    });

    return this.verificationTokenRepository.save(verificationToken);
  }

  async generatePhoneVerificationCode(
    user: User,
    phone: string,
  ): Promise<VerificationToken> {
    // Delete any existing phone verification tokens for this user
    await this.verificationTokenRepository.delete({
      userId: user.id,
      type: TokenType.PHONE_VERIFICATION,
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    const verificationToken = this.verificationTokenRepository.create({
      token: code, // For phone verification, we use the code as token
      type: TokenType.PHONE_VERIFICATION,
      expiresAt,
      userId: user.id,
      phone,
      code,
    });

    return this.verificationTokenRepository.save(verificationToken);
  }

  async validateToken(
    token: string,
    type: TokenType,
  ): Promise<VerificationToken | null> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { token, type },
      relations: ['user'],
    });

    if (!verificationToken || !verificationToken.isValid()) {
      return null;
    }

    return verificationToken;
  }

  async validatePhoneCode(
    userId: string,
    phone: string,
    code: string,
  ): Promise<VerificationToken | null> {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: {
        userId,
        phone,
        code,
        type: TokenType.PHONE_VERIFICATION,
      },
      relations: ['user'],
    });

    if (!verificationToken || !verificationToken.isValid()) {
      return null;
    }

    return verificationToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await this.verificationTokenRepository.update(tokenId, {
      isUsed: true,
      usedAt: new Date(),
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.verificationTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }

  async getUserActiveTokens(userId: string): Promise<VerificationToken[]> {
    return this.verificationTokenRepository.find({
      where: { userId, isUsed: false },
      order: { createdAt: 'DESC' },
    });
  }
}
