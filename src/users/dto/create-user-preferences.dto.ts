import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Language,
  Currency,
  TimeZone,
} from '../entities/user-preferences.entity';

export class CreateUserPreferencesDto {
  @ApiPropertyOptional({
    description: 'User language preference',
    enum: Language,
    default: Language.ENGLISH,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: 'User currency preference',
    enum: Currency,
    default: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'User timezone preference',
    enum: TimeZone,
    default: TimeZone.UTC,
  })
  @IsOptional()
  @IsEnum(TimeZone)
  timeZone?: TimeZone;

  @ApiPropertyOptional({
    description: 'Enable email notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable push notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable in-app notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable marketing emails',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional({ description: 'Enable price alerts', default: true })
  @IsOptional()
  @IsBoolean()
  priceAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable store updates', default: true })
  @IsOptional()
  @IsBoolean()
  storeUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Enable security alerts', default: true })
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable dark mode', default: false })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @ApiPropertyOptional({ description: 'Date format preference', default: 'en' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Time format preference', default: '12' })
  @IsOptional()
  @IsString()
  timeFormat?: string;

  @ApiPropertyOptional({
    description: 'Enable location services',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  locationServices?: boolean;

  @ApiPropertyOptional({
    description: 'Enable analytics tracking',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  analyticsTracking?: boolean;

  @ApiPropertyOptional({ description: 'Enable social features', default: true })
  @IsOptional()
  @IsBoolean()
  socialFeatures?: boolean;
}
