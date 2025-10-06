import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User, UserStatus, UserType } from '../entities/user.entity';
import { Role, RoleType } from '../entities/role.entity';
import { Permission, PermissionType } from '../entities/permission.entity';
import { JwtService, TokenPair } from './jwt.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
  UpdateProfileDto,
  AssignRoleDto,
  RemoveRoleDto,
  UpdateUserStatusDto,
} from '../dto/auth.dto';
import {
  AuthResponseDto,
  UserResponseDto,
  MessageResponseDto,
} from '../dto/auth-response.dto';
import { UsersSeeder } from '../../users/seeders/users.seeder';
import {
  ActivityType,
  ActivityLevel,
} from '../../users/entities/user-activity.entity';
import { AuthSeeder } from '../seeds/auth.seeder';
import { EmailService } from '../../common/services/email.service';
import { VerificationTokenService } from './verification-token.service';
import {
  VerificationToken,
  TokenType,
} from '../entities/verification-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersSeeder: UsersSeeder,
    private readonly authSeeder: AuthSeeder,
    private readonly emailService: EmailService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validate terms and conditions acceptance
    if (!registerDto.acceptTermsAndConditions) {
      throw new BadRequestException(
        'Terms and conditions must be accepted to register',
      );
    }

    // Check for existing email
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for existing username
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION,
      type: registerDto.type || UserType.INDIVIDUAL,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    const defaultRole = await this.getDefaultRole(
      registerDto.type || UserType.INDIVIDUAL,
    );
    if (defaultRole) {
      user.roles = [defaultRole];
    }

    const savedUser = await this.userRepository.save(user);

    // Create default profile and preferences for new user
    try {
      await this.usersSeeder.createDefaultProfile(savedUser.id, {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      await this.usersSeeder.createDefaultPreferences(savedUser.id);

      await this.usersSeeder.logInitialActivity(
        savedUser.id,
        ActivityType.LOGIN,
        'User registered and initial profile created',
      );
    } catch (error) {
      console.warn(
        'Failed to create default user profile/preferences:',
        error.message,
      );
    }

    // Generate email verification token and send verification email
    try {
      const verificationToken =
        await this.verificationTokenService.generateEmailVerificationToken(
          savedUser,
        );
      await this.emailService.sendEmailVerificationEmail(
        {
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
        },
        verificationToken.token,
      );
    } catch (error) {
      console.warn('Failed to send verification email:', error.message);
      // Don't fail registration if email sending fails
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail({
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        username: savedUser.username,
      });
    } catch (error) {
      console.warn('Failed to send welcome email:', error.message);
      // Don't fail registration if email sending fails
    }

    const tokens = this.jwtService.generateTokenPair(savedUser);

    return {
      ...tokens,
      user: this.mapUserToResponse(savedUser),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: [
        { email: loginDto.identifier },
        { username: loginDto.identifier },
      ],
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Log login activity
    try {
      await this.usersSeeder.logInitialActivity(
        user.id,
        ActivityType.LOGIN,
        'User logged in successfully',
      );
    } catch (error) {
      console.warn('Failed to log login activity:', error.message);
    }

    const tokens = this.jwtService.generateTokenPair(user);

    return {
      ...tokens,
      user: this.mapUserToResponse(user),
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const payload = this.jwtService.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || user.refreshToken !== refreshTokenDto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.jwtService.generateTokenPair(user);

    user.refreshToken = tokens.refreshToken;
    user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.save(user);

    return {
      ...tokens,
      user: this.mapUserToResponse(user),
    };
  }

  async logout(userId: string): Promise<MessageResponseDto> {
    await this.userRepository.update(userId, {
      refreshToken: undefined,
      refreshTokenExpiresAt: undefined,
    });

    // Log logout activity
    try {
      await this.usersSeeder.logInitialActivity(
        userId,
        ActivityType.LOGOUT,
        'User logged out successfully',
      );
    } catch (error) {
      console.warn('Failed to log logout activity:', error.message);
    }

    return { message: 'Successfully logged out' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    try {
      // Generate password reset token
      const verificationToken =
        await this.verificationTokenService.generatePasswordResetToken(user);

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        verificationToken.token,
      );
    } catch (error) {
      console.warn('Failed to send password reset email:', error.message);
      // Don't reveal if email sending failed
    }

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    // Validate reset token
    const verificationToken = await this.verificationTokenService.validateToken(
      resetPasswordDto.token,
      TokenType.PASSWORD_RESET,
    );

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    // Update password and invalidate all refresh tokens
    await this.userRepository.update(verificationToken.userId, {
      password: hashedPassword,
      refreshToken: undefined,
      refreshTokenExpiresAt: undefined,
    });

    // Mark token as used
    await this.verificationTokenService.markTokenAsUsed(verificationToken.id);

    return { message: 'Password successfully reset' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
      refreshToken: undefined,
      refreshTokenExpiresAt: undefined,
    });

    return { message: 'Password successfully changed' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<MessageResponseDto> {
    // Validate verification token
    const verificationToken = await this.verificationTokenService.validateToken(
      verifyEmailDto.token,
      TokenType.EMAIL_VERIFICATION,
    );

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user email verification status
    await this.userRepository.update(verificationToken.userId, {
      emailVerified: true,
      status: UserStatus.ACTIVE, // Activate user after email verification
    });

    // Mark token as used
    await this.verificationTokenService.markTokenAsUsed(verificationToken.id);

    return { message: 'Email successfully verified' };
  }

  async resendVerification(email: string): Promise<MessageResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    const verificationToken =
      await this.verificationTokenService.generateEmailVerificationToken(user);

    // Send verification email
    await this.emailService.sendEmailVerificationEmail(
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      verificationToken.token,
    );

    return { message: 'Verification email sent successfully' };
  }

  async verifyPhone(
    verifyPhoneDto: VerifyPhoneDto,
  ): Promise<MessageResponseDto> {
    // Find user by phone
    const user = await this.userRepository.findOne({
      where: { phone: verifyPhoneDto.phone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate phone verification code
    const verificationToken =
      await this.verificationTokenService.validatePhoneCode(
        user.id,
        verifyPhoneDto.phone,
        verifyPhoneDto.code,
      );

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Update user phone verification status
    await this.userRepository.update(user.id, {
      phoneVerified: true,
    });

    // Mark token as used
    await this.verificationTokenService.markTokenAsUsed(verificationToken.id);

    return { message: 'Phone successfully verified' };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user profile
    Object.assign(user, updateProfileDto);
    const updatedUser = await this.userRepository.save(user);

    return this.mapUserToResponse(updatedUser);
  }

  async assignRole(assignRoleDto: AssignRoleDto): Promise<MessageResponseDto> {
    const [user, role] = await Promise.all([
      this.userRepository.findOne({
        where: { id: assignRoleDto.userId },
        relations: ['roles'],
      }),
      this.roleRepository.findOne({
        where: { id: assignRoleDto.roleId },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if user already has this role
    if (user.roles.some((userRole) => userRole.id === role.id)) {
      throw new ConflictException('User already has this role');
    }

    // Add role to user
    user.roles.push(role);
    await this.userRepository.save(user);

    return { message: 'Role successfully assigned to user' };
  }

  async removeRole(removeRoleDto: RemoveRoleDto): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: removeRoleDto.userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove role from user
    user.roles = user.roles.filter((role) => role.id !== removeRoleDto.roleId);
    await this.userRepository.save(user);

    return { message: 'Role successfully removed from user' };
  }

  async updateUserStatus(
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: updateUserStatusDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user status
    await this.userRepository.update(updateUserStatusDto.userId, {
      status: updateUserStatusDto.status,
    });

    return { message: 'User status successfully updated' };
  }

  private async getDefaultRole(userType: UserType): Promise<Role | null> {
    let defaultRoleName: RoleType;

    switch (userType) {
      case UserType.BUSINESS:
        defaultRoleName = RoleType.STORE_ADMIN;
        break;
      case UserType.INDIVIDUAL:
      default:
        defaultRoleName = RoleType.CUSTOMER;
        break;
    }

    return this.roleRepository.findOne({
      where: { name: defaultRoleName },
    });
  }

  private mapUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      type: user.type,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isVerified: user.isVerified,
      avatar: user.avatar,
      roles:
        user.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          priority: role.priority,
          permissions:
            role.permissions?.map((permission) => ({
              id: permission.id,
              name: permission.name,
              displayName: permission.displayName,
              description: permission.description,
              category: permission.category,
              priority: permission.priority,
            })) || [],
        })) || [],
      permissions: this.extractPermissions(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private extractPermissions(user: User): string[] {
    const permissions = new Set<string>();

    if (user.roles) {
      user.roles.forEach((role) => {
        if (role.permissions) {
          role.permissions.forEach((permission) => {
            permissions.add(permission.name);
          });
        }
      });
    }

    return Array.from(permissions);
  }

  private parseJwtExpiresIn(expiresIn: string): number {
    // Parse JWT_EXPIRES_IN format (e.g., "15m", "1h", "7d") to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default to 15 minutes if format is invalid
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // Default to 15 minutes
    }
  }

  /**
   * Run Authentication Seeder - Endpoint without authentication
   * Creates all roles and permissions in the system
   */
  async runAuthSeeder(): Promise<MessageResponseDto> {
    console.log('🌱 Running Authentication Seeder via API endpoint...');

    try {
      await this.authSeeder.seed();

      console.log('✅ Authentication Seeder completed successfully via API');
      return {
        message:
          'Authentication seeder completed successfully. All roles and permissions have been created.',
      };
    } catch (error) {
      console.error(
        '❌ Error running Authentication Seeder via API:',
        error.message,
      );
      throw new BadRequestException(
        'Failed to run authentication seeder: ' + error.message,
      );
    }
  }

  /**
   * Create Super Admin - Endpoint without authentication
   * Only works if no SUPER_ADMIN exists in the system
   */
  async createSuperAdmin(createSuperAdminDto: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponseDto> {
    console.log('🚀 Creating Super Admin via API endpoint...');

    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.name = :roleName', { roleName: RoleType.SUPER_ADMIN })
      .getOne();

    if (existingSuperAdmin) {
      throw new ConflictException(
        'Super Admin already exists in the system. Cannot create another one.',
      );
    }

    // Validate input
    if (
      !createSuperAdminDto.email ||
      !createSuperAdminDto.username ||
      !createSuperAdminDto.password
    ) {
      throw new BadRequestException(
        'Email, username, and password are required',
      );
    }

    // Check if user with same email or username already exists
    // Check for existing email
    const existingEmail = await this.userRepository.findOne({
      where: { email: createSuperAdminDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for existing username
    const existingUsername = await this.userRepository.findOne({
      where: { username: createSuperAdminDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('User with this username already exists');
    }

    // Get SUPER_ADMIN role
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: RoleType.SUPER_ADMIN },
      relations: ['permissions'],
    });

    if (!superAdminRole) {
      throw new NotFoundException(
        'SUPER_ADMIN role not found. Please run the auth seeder first.',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createSuperAdminDto.password, 12);

    // Create Super Admin user
    const superAdminUser = this.userRepository.create({
      username: createSuperAdminDto.username,
      email: createSuperAdminDto.email,
      password: hashedPassword,
      firstName: createSuperAdminDto.firstName || 'Super',
      lastName: createSuperAdminDto.lastName || 'Admin',
      type: UserType.SYSTEM,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      isVerified: true,
      roles: [superAdminRole],
      metadata: {
        createdBy: 'api_endpoint',
        purpose: 'super_admin_initial_setup',
        notes: 'Super Admin created via API endpoint',
      },
    });

    try {
      const savedUser = await this.userRepository.save(superAdminUser);

      console.log('✅ Super Admin created successfully via API:');
      console.log(`   👤 Username: ${savedUser.username}`);
      console.log(`   📧 Email: ${savedUser.email}`);
      console.log(
        `   🔐 Roles: ${savedUser.roles.map((role) => role.name).join(', ')}`,
      );

      // Generate tokens
      const tokens = this.jwtService.generateTokenPair(savedUser);

      // Convert JWT_EXPIRES_IN to seconds
      const expiresInString = this.configService.get<string>(
        'JWT_EXPIRES_IN',
        '15m',
      );
      const expiresInSeconds = this.parseJwtExpiresIn(expiresInString);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.mapUserToResponse(savedUser),
        expiresIn: expiresInSeconds,
      };
    } catch (error) {
      console.error('❌ Error creating Super Admin via API:', error.message);
      throw new BadRequestException(
        'Failed to create Super Admin: ' + error.message,
      );
    }
  }

  async checkUsernameExists(
    username: string,
  ): Promise<{ exists: boolean; message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    return {
      exists: !!existingUser,
      message: existingUser
        ? 'Username already exists'
        : 'Username is available',
    };
  }

  async checkEmailExists(
    email: string,
  ): Promise<{ exists: boolean; message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    return {
      exists: !!existingUser,
      message: existingUser ? 'Email already exists' : 'Email is available',
    };
  }
}
