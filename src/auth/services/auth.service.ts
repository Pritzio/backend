import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { AuthResponseDto, UserResponseDto, MessageResponseDto } from '../dto/auth-response.dto';
import { UsersSeeder } from '../../users/seeders/users.seeder';
import { ActivityType, ActivityLevel } from '../../users/entities/user-activity.entity';

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
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { username: registerDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION,
      type: registerDto.type || UserType.INDIVIDUAL,
    });

    const defaultRole = await this.getDefaultRole(registerDto.type || UserType.INDIVIDUAL);
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
        'User registered and initial profile created'
      );
    } catch (error) {
      console.warn('Failed to create default user profile/preferences:', error.message);
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

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
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
        'User logged in successfully'
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

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const payload = this.jwtService.verifyRefreshToken(refreshTokenDto.refreshToken);
    
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
        'User logged out successfully'
      );
    } catch (error) {
      console.warn('Failed to log logout activity:', error.message);
    }

    return { message: 'Successfully logged out' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token (in production, send email)
    const resetToken = uuidv4();
    // TODO: Send email with reset token
    // await this.emailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
    // TODO: Implement token validation from database or cache
    // For now, we'll assume the token is valid

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    // Find user by token (implement proper token lookup)
    // const user = await this.findUserByResetToken(resetPasswordDto.token);
    
    // if (!user) {
    //   throw new BadRequestException('Invalid or expired reset token');
    // }

    // Update password
    // await this.userRepository.update(user.id, {
    //   password: hashedPassword,
    //   refreshToken: null,
    //   refreshTokenExpiresAt: null,
    // });

    return { message: 'Password successfully reset' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<MessageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
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

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
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
    if (user.roles.some(userRole => userRole.id === role.id)) {
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
    user.roles = user.roles.filter(role => role.id !== removeRoleDto.roleId);
    await this.userRepository.save(user);

    return { message: 'Role successfully removed from user' };
  }

  async updateUserStatus(updateUserStatusDto: UpdateUserStatusDto): Promise<MessageResponseDto> {
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
      roles: user.roles?.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        priority: role.priority,
        permissions: role.permissions?.map(permission => ({
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
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => {
            permissions.add(permission.name);
          });
        }
      });
    }

    return Array.from(permissions);
  }
}
