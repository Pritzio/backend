import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile, Gender, ProfileVisibility } from '../entities/user-profile.entity';
import { UserPreferences, Language, Currency, TimeZone } from '../entities/user-preferences.entity';
import { UserActivity, ActivityType, ActivityLevel } from '../entities/user-activity.entity';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { CreateUserPreferencesDto } from '../dto/create-user-preferences.dto';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { IUserProfileResponse, IUserProfileSummary } from '../interfaces/user-profile.interface';
import { UserStatus } from '../../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async createUserProfile(userId: string, createUserProfileDto: CreateUserProfileDto): Promise<UserProfile> {
    const existingProfile = await this.userProfileRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new BadRequestException('User profile already exists');
    }

    // Business rule: Validate profile data consistency
    this.validateProfileData(createUserProfileDto);

    const profile = this.userProfileRepository.create({
      userId,
      ...createUserProfileDto,
    });

    const savedProfile = await this.userProfileRepository.save(profile);

    await this.logUserActivity(userId, ActivityType.PROFILE_UPDATE, ActivityLevel.INFO, 'Profile created');

    return savedProfile;
  }

  async getUserProfile(userId: string, requestingUserId: string): Promise<IUserProfileResponse> {
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    if (profile.profileVisibility === ProfileVisibility.PRIVATE && userId !== requestingUserId) {
      throw new ForbiddenException('Profile is private');
    }

    if (profile.profileVisibility === ProfileVisibility.FRIENDS && userId !== requestingUserId) {
      // TODO: Implement friend check logic
      throw new ForbiddenException('Profile is only visible to friends');
    }

    return this.enrichProfileResponse(profile);
  }

  async updateUserProfile(userId: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    // Business rule: Validate profile data consistency
    this.validateProfileData(updateUserProfileDto);

    // Business rule: Check for significant changes that require verification
    const significantChanges = this.checkSignificantChanges(profile, updateUserProfileDto);
    if (significantChanges.length > 0) {
      await this.logUserActivity(
        userId, 
        ActivityType.PROFILE_UPDATE, 
        ActivityLevel.WARNING, 
        'Significant profile changes detected',
        `Changed fields: ${significantChanges.join(', ')}`
      );
    }

    Object.assign(profile, updateUserProfileDto);
    const updatedProfile = await this.userProfileRepository.save(profile);

    await this.logUserActivity(userId, ActivityType.PROFILE_UPDATE, ActivityLevel.INFO, 'Profile updated');

    return updatedProfile;
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    await this.userProfileRepository.remove(profile);
    await this.logUserActivity(userId, ActivityType.PROFILE_UPDATE, ActivityLevel.INFO, 'Profile deleted');
  }

  async createUserPreferences(userId: string, createUserPreferencesDto: CreateUserPreferencesDto): Promise<UserPreferences> {
    const existingPreferences = await this.userPreferencesRepository.findOne({ where: { userId } });
    if (existingPreferences) {
      throw new BadRequestException('User preferences already exist');
    }

    const preferences = this.userPreferencesRepository.create({
      userId,
      ...createUserPreferencesDto,
    });

    const savedPreferences = await this.userPreferencesRepository.save(preferences);

    await this.logUserActivity(userId, ActivityType.PREFERENCES_UPDATE, ActivityLevel.INFO, 'Preferences created');

    return savedPreferences;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const preferences = await this.userPreferencesRepository.findOne({ where: { userId } });
    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    return preferences;
  }

  async updateUserPreferences(userId: string, updateUserPreferencesDto: UpdateUserPreferencesDto): Promise<UserPreferences> {
    const preferences = await this.userPreferencesRepository.findOne({ where: { userId } });
    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    Object.assign(preferences, updateUserPreferencesDto);
    const updatedPreferences = await this.userPreferencesRepository.save(preferences);

    await this.logUserActivity(userId, ActivityType.PREFERENCES_UPDATE, ActivityLevel.INFO, 'Preferences updated');

    return updatedPreferences;
  }

  async searchUsers(query: string, requestingUserId: string, limit: number = 10): Promise<IUserProfileSummary[]> {
    const profiles = await this.userProfileRepository
      .createQueryBuilder('profile')
      .where('profile.profileVisibility = :visibility', { visibility: ProfileVisibility.PUBLIC })
      .andWhere(
        '(profile.firstName ILIKE :query OR profile.lastName ILIKE :query OR profile.bio ILIKE :query)',
        { query: `%${query}%` }
      )
      .andWhere('profile.userId != :requestingUserId', { requestingUserId })
      .andWhere('profile.isActive = :isActive', { isActive: true })
      .limit(limit)
      .getMany();

    return profiles.map(profile => ({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      isVerified: profile.isVerified,
      profileVisibility: profile.profileVisibility,
    }));
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async logUserActivity(
    userId: string,
    activityType: ActivityType,
    activityLevel: ActivityLevel,
    description: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const activity = this.userActivityRepository.create({
      userId,
      activityType,
      activityLevel,
      description,
      details,
      metadata,
      isSuccessful: true,
    });

    await this.userActivityRepository.save(activity);
  }

  async logUserActivityWithContext(
    userId: string,
    activityType: ActivityType,
    activityLevel: ActivityLevel,
    description: string,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string,
    location?: string,
    sessionId?: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const activity = this.userActivityRepository.create({
      userId,
      activityType,
      activityLevel,
      description,
      details,
      metadata,
      ipAddress,
      userAgent,
      deviceId,
      location,
      sessionId,
      isSuccessful: true,
    });

    await this.userActivityRepository.save(activity);
  }

  private enrichProfileResponse(profile: UserProfile): IUserProfileResponse {
    const response: IUserProfileResponse = { ...profile };

    if (profile.firstName || profile.lastName) {
      response.fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      response.displayName = response.fullName;
    }

    if (profile.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(profile.dateOfBirth);
      response.age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        response.age--;
      }
    }

    if (profile.city || profile.state || profile.country) {
      response.location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
    }

    return response;
  }

  async getProfileStats(userId: string): Promise<{ profileCompleteness: number; lastActivity: Date | undefined }> {
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    const lastActivity = await this.userActivityRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    let profileCompleteness = 0;
    if (profile) {
      const fields = [
        profile.firstName, profile.lastName, profile.dateOfBirth, profile.gender,
        profile.phone, profile.address, profile.city, profile.state,
        profile.zipCode, profile.country, profile.website, profile.bio,
        profile.avatar, profile.coverPhoto
      ];
      const filledFields = fields.filter(field => field !== null && field !== undefined).length;
      profileCompleteness = Math.round((filledFields / fields.length) * 100);
    }

    return {
      profileCompleteness,
      lastActivity: lastActivity?.createdAt || profile?.createdAt,
    };
  }

  private validateProfileData(profileData: any): void {
    // Business rule: Phone and email should not be the same format
    if (profileData.phone && profileData.email) {
      const phoneDigits = profileData.phone.replace(/\D/g, '');
      if (profileData.email.includes(phoneDigits)) {
        throw new BadRequestException('Phone number and email should not be similar');
      }
    }

    // Business rule: Website should match user's professional context
    if (profileData.website && profileData.bio) {
      const suspiciousPatterns = ['spam', 'click here', 'buy now', 'free money'];
      const combinedText = `${profileData.website} ${profileData.bio}`.toLowerCase();
      
      for (const pattern of suspiciousPatterns) {
        if (combinedText.includes(pattern)) {
          throw new BadRequestException('Profile content appears to be promotional or spam');
        }
      }
    }

    // Business rule: Address components should be consistent
    if (profileData.zipCode && profileData.country) {
      const isUSZip = /^\d{5}(-\d{4})?$/.test(profileData.zipCode);
      const isUSCountry = profileData.country.toLowerCase().includes('usa') || 
                         profileData.country.toLowerCase().includes('united states');
      
      if (isUSZip && !isUSCountry) {
        throw new BadRequestException('ZIP code format does not match the specified country');
      }
    }
  }

  private checkSignificantChanges(currentProfile: UserProfile, updateData: any): string[] {
    const significantFields = ['firstName', 'lastName', 'dateOfBirth', 'phone', 'email'];
    const changes: string[] = [];

    for (const field of significantFields) {
      if (updateData[field] && updateData[field] !== currentProfile[field]) {
        changes.push(field);
      }
    }

    return changes;
  }

  // ===== ADMINISTRATIVE METHODS =====

  async getAllUsers(page: number = 1, limit: number = 20, status?: string, role?: string) {
    const skip = (page - 1) * limit;
    
    let query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('user.roles', 'roles')
      .skip(skip)
      .take(limit);

    if (status) {
      query = query.andWhere('user.status = :status', { status });
    }

    if (role) {
      query = query.andWhere('roles.name = :role', { role });
    }

    const [profiles, total] = await query.getManyAndCount();

    return {
      users: profiles.map(profile => ({
        id: profile.user.id,
        username: profile.user.username,
        email: profile.user.email,
        status: profile.user.status,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          isVerified: profile.isVerified,
          isActive: profile.isActive,
          profileVisibility: profile.profileVisibility,
        },
        roles: profile.user.roles?.map(role => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        })) || [],
        createdAt: profile.user.createdAt,
        lastLoginAt: profile.user.lastLoginAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminUserInfo(userId: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    const preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    const recentActivity = await this.userActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      id: profile.user.id,
      username: profile.user.username,
      email: profile.user.email,
      status: profile.user.status,
      type: profile.user.type,
      emailVerified: profile.user.emailVerified,
      phoneVerified: profile.user.phoneVerified,
      profile: {
        ...profile,
        user: undefined, // Remove circular reference
      },
      preferences: preferences || null,
      roles: profile.user.roles?.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions?.map(permission => ({
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          category: permission.category,
        })) || [],
      })) || [],
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        activityType: activity.activityType,
        description: activity.description,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        createdAt: activity.createdAt,
      })),
      createdAt: profile.user.createdAt,
      updatedAt: profile.user.updatedAt,
      lastLoginAt: profile.user.lastLoginAt,
    };
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    // Update user status in the main user table
    await this.userProfileRepository.manager.getRepository('users').update(userId, {
      status,
    });

    // Update profile active status
    profile.isActive = status === 'active';
    await this.userProfileRepository.save(profile);

    // Log the status change
    await this.logUserActivity(
      userId,
      ActivityType.SECURITY_ALERT,
      ActivityLevel.WARNING,
      `User status changed to ${status}`,
      reason ? `Reason: ${reason}` : undefined,
      { previousStatus: profile.user.status, newStatus: status, reason }
    );

    return { message: `User status updated to ${status}`, userId, status };
  }

  async deleteUser(userId: string, currentUser: any, softDeleteDto?: any) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'user.roles'],
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    const targetUser = profile.user;
    const currentUserRoles = currentUser.roles?.map(role => role.name) || [];

    // Security rules for user deletion
    const canDelete = this.validateUserDeletionPermissions(
      currentUserRoles,
      targetUser.roles?.map(role => role.name) || [],
      currentUser.id === userId
    );

    if (!canDelete.allowed) {
      throw new ForbiddenException(canDelete.reason);
    }

    // Perform soft delete instead of hard delete
    const deletionData = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: currentUser.id,
      deletionReason: softDeleteDto?.reason || 'Deleted by administrator',
      status: UserStatus.INACTIVE,
    };

    // Update user status to inactive and mark as deleted
    await this.userProfileRepository.manager.getRepository('users').update(userId, deletionData);

    // Update profile active status
    profile.isActive = false;
    await this.userProfileRepository.save(profile);

    // Log the soft deletion
    await this.logUserActivity(
      userId,
      ActivityType.SECURITY_ALERT,
      ActivityLevel.WARNING,
      'User account soft deleted',
      `Account marked as deleted by ${currentUser.username}`,
      {
        deletedBy: currentUser.id,
        deletionReason: softDeleteDto?.reason,
        notes: softDeleteDto?.notes,
        timestamp: new Date().toISOString(),
        action: 'soft_delete'
      }
    );

    // Log activity for the admin who performed the deletion
    await this.logUserActivity(
      currentUser.id,
      ActivityType.SECURITY_ALERT,
      ActivityLevel.INFO,
      'Soft deleted user account',
      `Deleted user: ${targetUser.username} (${targetUser.email})`,
      {
        targetUserId: userId,
        targetUsername: targetUser.username,
        targetEmail: targetUser.email,
        deletionReason: softDeleteDto?.reason,
        timestamp: new Date().toISOString()
      }
    );

    return {
      message: 'User account soft deleted successfully',
      userId,
      deletedAt: deletionData.deletedAt,
      deletedBy: currentUser.username,
      canBeRestored: true,
    };
  }

  private validateUserDeletionPermissions(
    currentUserRoles: string[],
    targetUserRoles: string[],
    isSelfDeletion: boolean
  ): { allowed: boolean; reason?: string } {
    const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');
    const isAdmin = currentUserRoles.includes('ADMIN');
    const targetIsSuperAdmin = targetUserRoles.includes('SUPER_ADMIN');
    const targetIsAdmin = targetUserRoles.includes('ADMIN');

    // SUPER_ADMIN can delete anyone (including other SUPER_ADMINs)
    if (isSuperAdmin) {
      return { allowed: true };
    }

    // ADMIN can delete users but NOT SUPER_ADMINs or other ADMINs
    if (isAdmin) {
      if (targetIsSuperAdmin) {
        return { allowed: false, reason: 'ADMIN cannot delete SUPER_ADMIN users' };
      }
      if (targetIsAdmin) {
        return { allowed: false, reason: 'ADMIN cannot delete other ADMIN users' };
      }
      return { allowed: true };
    }

    // Regular users cannot delete anyone
    return { allowed: false, reason: 'Insufficient permissions to delete users' };
  }

  async restoreUser(userId: string, currentUser: any, restoreReason?: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    if (!profile.user.isDeleted) {
      throw new BadRequestException('User is not deleted');
    }

    // Only SUPER_ADMIN can restore users
    const currentUserRoles = currentUser.roles?.map(role => role.name) || [];
    if (!currentUserRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only SUPER_ADMIN can restore deleted users');
    }

    // Restore the user
    const restoreData = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      status: UserStatus.ACTIVE,
    };

    // Update user status and remove deletion markers
    await this.userProfileRepository.manager.getRepository('users').update(userId, restoreData);

    // Update profile active status
    profile.isActive = true;
    await this.userProfileRepository.save(profile);

    // Log the restoration
    await this.logUserActivity(
      userId,
      ActivityType.SECURITY_ALERT,
      ActivityLevel.INFO,
      'User account restored',
      `Account restored by ${currentUser.username}`,
      {
        restoredBy: currentUser.id,
        restoreReason,
        timestamp: new Date().toISOString(),
        action: 'restore'
      }
    );

    // Log activity for the admin who performed the restoration
    await this.logUserActivity(
      currentUser.id,
      ActivityType.SECURITY_ALERT,
      ActivityLevel.INFO,
      'Restored deleted user account',
      `Restored user: ${profile.user.username} (${profile.user.email})`,
      {
        targetUserId: userId,
        targetUsername: profile.user.username,
        targetEmail: profile.user.email,
        restoreReason,
        timestamp: new Date().toISOString()
      }
    );

    return {
      message: 'User account restored successfully',
      userId,
      restoredAt: new Date(),
      restoredBy: currentUser.username,
      status: 'active',
    };
  }

  async getUserAnalytics() {
    const totalUsers = await this.userProfileRepository.count();
    const activeUsers = await this.userProfileRepository.count({ where: { isActive: true } });
    const verifiedUsers = await this.userProfileRepository.count({ where: { isVerified: true } });

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await this.userProfileRepository
      .createQueryBuilder('profile')
      .where('profile.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    // Get activity statistics
    const totalActivities = await this.userActivityRepository.count();
    const recentActivities = await this.userActivityRepository.count({
      where: { createdAt: { $gte: thirtyDaysAgo } as any },
    });

    // Get profile completeness distribution
    const profiles = await this.userProfileRepository.find();
    const completenessStats = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0,
    };

    profiles.forEach(profile => {
      const completeness = this.calculateProfileCompleteness(profile);
      if (completeness <= 25) completenessStats['0-25%']++;
      else if (completeness <= 50) completenessStats['26-50%']++;
      else if (completeness <= 75) completenessStats['51-75%']++;
      else completenessStats['76-100%']++;
    });

    return {
      overview: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersLast30Days: newUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        verifiedPercentage: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      },
      activity: {
        totalActivities,
        recentActivities,
        averageActivitiesPerUser: totalUsers > 0 ? Math.round(totalActivities / totalUsers) : 0,
      },
      profileCompleteness: completenessStats,
      trends: {
        userGrowth: newUsers,
        activityGrowth: recentActivities,
      },
    };
  }

  private calculateProfileCompleteness(profile: UserProfile): number {
    const fields = [
      profile.firstName, profile.lastName, profile.dateOfBirth, profile.gender,
      profile.phone, profile.address, profile.city, profile.state,
      profile.zipCode, profile.country, profile.website, profile.bio,
      profile.avatar, profile.coverPhoto
    ];
    const filledFields = fields.filter(field => field !== null && field !== undefined).length;
    return Math.round((filledFields / fields.length) * 100);
  }
}
