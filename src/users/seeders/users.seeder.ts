import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserProfile,
  Gender,
  ProfileVisibility,
} from '../entities/user-profile.entity';
import {
  UserPreferences,
  Language,
  Currency,
  TimeZone,
} from '../entities/user-preferences.entity';
import {
  UserActivity,
  ActivityType,
  ActivityLevel,
} from '../entities/user-activity.entity';

@Injectable()
export class UsersSeeder {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async seed() {
    console.log('🌱 Starting Users Module Seeding...');

    try {
      // Seed will be called when needed
      console.log('✅ Users Module Seeding completed');
    } catch (error) {
      console.error('❌ Error during Users Module Seeding:', error);
      throw error;
    }
  }

  async createDefaultProfile(
    userId: string,
    profileData: Partial<UserProfile> = {},
  ): Promise<UserProfile> {
    const defaultProfile = this.userProfileRepository.create({
      userId,
      firstName: profileData.firstName || 'Default',
      lastName: profileData.lastName || 'User',
      profileVisibility: ProfileVisibility.PUBLIC,
      isVerified: false,
      isActive: true,
      ...profileData,
    });

    return this.userProfileRepository.save(defaultProfile);
  }

  async createDefaultPreferences(
    userId: string,
    preferencesData: Partial<UserPreferences> = {},
  ): Promise<UserPreferences> {
    const defaultPreferences = this.userPreferencesRepository.create({
      userId,
      language: Language.ENGLISH,
      currency: Currency.USD,
      timeZone: TimeZone.UTC,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      marketingEmails: true,
      priceAlerts: true,
      storeUpdates: true,
      securityAlerts: true,
      darkMode: false,
      dateFormat: 'en',
      timeFormat: '12',
      locationServices: true,
      analyticsTracking: true,
      socialFeatures: true,
      ...preferencesData,
    });

    return this.userPreferencesRepository.save(defaultPreferences);
  }

  async logInitialActivity(
    userId: string,
    activityType: ActivityType,
    description: string,
  ): Promise<void> {
    const activity = this.userActivityRepository.create({
      userId,
      activityType,
      activityLevel: ActivityLevel.INFO,
      description,
      isSuccessful: true,
    });

    await this.userActivityRepository.save(activity);
  }
}
