import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, RoleType } from '../entities/role.entity';
import {
  Permission,
  PermissionType,
  PermissionCategory,
} from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

export interface IRoleSummary {
  id: string;
  name: RoleType;
  displayName: string;
  description?: string;
  isSystem: boolean;
  priority: number;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDetail extends IRoleSummary {
  permissions: Permission[];
  users: User[];
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface IPermissionCategory {
  category: PermissionCategory;
  displayName: string;
  permissions: Permission[];
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getRoles(
    page: number = 1,
    limit: number = 20,
    isSystem?: boolean,
  ): Promise<{ roles: IRoleSummary[]; pagination: IPagination }> {
    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (isSystem !== undefined) {
      queryBuilder.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    const total = await queryBuilder.getCount();
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const roles = await queryBuilder
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('role.users', 'user')
      .orderBy('role.priority', 'DESC')
      .addOrderBy('role.createdAt', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();

    const roleSummaries: IRoleSummary[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      priority: role.priority,
      userCount: role.users?.length || 0,
      permissionCount: role.permissions?.length || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return {
      roles: roleSummaries,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async getAllRoles(): Promise<IRoleSummary[]> {
    try {
      const basicRoles = await this.roleRepository.find({
        order: {
          priority: 'DESC',
          displayName: 'ASC',
        },
      });

      const roles = basicRoles.map((basicRole) => ({
        id: basicRole.id,
        name: basicRole.name,
        displayName: basicRole.displayName,
        description: basicRole.description,
        isSystem: basicRole.isSystem,
        priority: basicRole.priority,
        userCount: 0,
        permissionCount: 0,
        createdAt: basicRole.createdAt,
        updatedAt: basicRole.updatedAt,
      }));

      return roles;
    } catch (error) {
      throw error;
    }
  }

  async getRoleById(id: string): Promise<IRoleDetail> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      priority: role.priority,
      userCount: role.users.length,
      permissionCount: role.permissions.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions,
      users: role.users,
    };
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<IRoleDetail> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name as RoleType },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name as RoleType,
      displayName: createRoleDto.displayName,
      description: createRoleDto.description,
      isSystem: createRoleDto.isSystem || false,
      priority: createRoleDto.priority || 0,
    });

    const savedRole = await this.roleRepository.save(role);

    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(createRoleDto.permissionIds) },
      });

      if (permissions.length !== createRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      savedRole.permissions = permissions;
      await this.roleRepository.save(savedRole);
    }

    return this.getRoleById(savedRole.id);
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<IRoleDetail> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (
      role.isSystem &&
      updateRoleDto.name &&
      updateRoleDto.name !== role.name
    ) {
      throw new BadRequestException('Cannot change name of system role');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name as RoleType },
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    if (updateRoleDto.displayName !== undefined)
      role.displayName = updateRoleDto.displayName;
    if (updateRoleDto.description !== undefined)
      role.description = updateRoleDto.description;
    if (updateRoleDto.priority !== undefined)
      role.priority = updateRoleDto.priority;
    if (updateRoleDto.name !== undefined)
      role.name = updateRoleDto.name as RoleType;

    if (updateRoleDto.permissionIds !== undefined) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(updateRoleDto.permissionIds) },
      });

      if (permissions.length !== updateRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      role.permissions = permissions;
    }

    await this.roleRepository.save(role);

    return this.getRoleById(id);
  }

  async deleteRole(id: string): Promise<{ message: string }> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    if (role.users.length > 0) {
      throw new ConflictException(
        'Cannot delete role that is assigned to users',
      );
    }

    await this.roleRepository.remove(role);

    return { message: 'Role deleted successfully' };
  }

  async assignPermission(
    roleId: string,
    permissionId: string,
  ): Promise<{ message: string }> {
    const [role, permission] = await Promise.all([
      this.roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions'],
      }),
      this.permissionRepository.findOne({
        where: { id: permissionId },
      }),
    ]);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (role.permissions.some((p) => p.id === permission.id)) {
      throw new ConflictException('Permission already assigned to this role');
    }

    role.permissions.push(permission);
    await this.roleRepository.save(role);

    return { message: 'Permission assigned successfully' };
  }

  async removePermission(
    roleId: string,
    permissionId: string,
  ): Promise<{ message: string }> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissionIndex = role.permissions.findIndex(
      (p) => p.id === permissionId,
    );
    if (permissionIndex === -1) {
      throw new NotFoundException('Permission not assigned to this role');
    }

    role.permissions.splice(permissionIndex, 1);
    await this.roleRepository.save(role);

    return { message: 'Permission removed successfully' };
  }

  async getUsersWithRole(
    roleId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: User[]; pagination: IPagination }> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.id = :roleId', { roleId });

    const total = await queryBuilder.getCount();
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: {
        category: 'ASC',
        priority: 'DESC',
        displayName: 'ASC',
      },
    });
  }

  async getPermissionsByCategory(): Promise<IPermissionCategory[]> {
    const permissions = await this.permissionRepository.find({
      order: {
        category: 'ASC',
        priority: 'DESC',
        displayName: 'ASC',
      },
    });

    const categories: IPermissionCategory[] = [];
    const categoryMap = new Map<PermissionCategory, Permission[]>();

    permissions.forEach((permission) => {
      if (!categoryMap.has(permission.category)) {
        categoryMap.set(permission.category, []);
      }
      categoryMap.get(permission.category)!.push(permission);
    });

    categoryMap.forEach((permissions, category) => {
      categories.push({
        category,
        displayName: this.getCategoryDisplayName(category),
        permissions,
      });
    });

    return categories;
  }

  async getRoleCounts(
    roleId: string,
  ): Promise<{ userCount: number; permissionCount: number }> {
    try {
      const userCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.id = :roleId', { roleId })
        .getCount();

      const permissionCount = await this.permissionRepository
        .createQueryBuilder('permission')
        .innerJoin('permission.roles', 'role')
        .where('role.id = :roleId', { roleId })
        .getCount();

      return { userCount, permissionCount };
    } catch (error) {
      return { userCount: 0, permissionCount: 0 };
    }
  }

  async getAllRolesWithCounts(): Promise<IRoleSummary[]> {
    try {
      const basicRoles = await this.roleRepository.find({
        order: {
          priority: 'DESC',
          displayName: 'ASC',
        },
      });

      const rolesWithCounts = await Promise.all(
        basicRoles.map(async (basicRole) => {
          try {
            const userCount = await this.userRepository
              .createQueryBuilder('user')
              .innerJoin('user.roles', 'role')
              .where('role.id = :roleId', { roleId: basicRole.id })
              .getCount();

            const permissionCount = await this.permissionRepository
              .createQueryBuilder('permission')
              .innerJoin('permission.roles', 'role')
              .where('role.id = :roleId', { roleId: basicRole.id })
              .getCount();

            return {
              id: basicRole.id,
              name: basicRole.name,
              displayName: basicRole.displayName,
              description: basicRole.description,
              isSystem: basicRole.isSystem,
              priority: basicRole.priority,
              userCount,
              permissionCount,
              createdAt: basicRole.createdAt,
              updatedAt: basicRole.updatedAt,
            };
          } catch (error) {
            return {
              id: basicRole.id,
              name: basicRole.name,
              displayName: basicRole.displayName,
              description: basicRole.description,
              isSystem: basicRole.isSystem,
              priority: basicRole.priority,
              userCount: 0,
              permissionCount: 0,
              createdAt: basicRole.createdAt,
              updatedAt: basicRole.updatedAt,
            };
          }
        }),
      );

      return rolesWithCounts;
    } catch (error) {
      throw error;
    }
  }

  private getCategoryDisplayName(category: PermissionCategory): string {
    const displayNames = {
      [PermissionCategory.USER_MANAGEMENT]: 'User Management',
      [PermissionCategory.ROLE_MANAGEMENT]: 'Role Management',
      [PermissionCategory.STORE_MANAGEMENT]: 'Store Management',
      [PermissionCategory.PRODUCT_MANAGEMENT]: 'Product Management',
      [PermissionCategory.PRICE_MANAGEMENT]: 'Price Management',
      [PermissionCategory.ANALYTICS]: 'Analytics & Reports',
      [PermissionCategory.SYSTEM_ADMIN]: 'System Administration',
    };

    return displayNames[category] || category;
  }
}
