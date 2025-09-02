import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleType } from '../entities/role.entity';
import {
  Permission,
  PermissionType,
  PermissionCategory,
} from '../entities/permission.entity';

@Injectable()
export class AuthSeeder {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async seed(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
  }

  private async seedPermissions(): Promise<void> {
    const permissions = [
      // User Management
      {
        name: PermissionType.USER_CREATE,
        displayName: 'Create Users',
        description: 'Can create new users in the system',
        category: PermissionCategory.USER_MANAGEMENT,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.USER_READ,
        displayName: 'Read Users',
        description: 'Can view user information',
        category: PermissionCategory.USER_MANAGEMENT,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.USER_UPDATE,
        displayName: 'Update Users',
        description: 'Can modify user information',
        category: PermissionCategory.USER_MANAGEMENT,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.USER_DELETE,
        displayName: 'Delete Users',
        description: 'Can remove users from the system',
        category: PermissionCategory.USER_MANAGEMENT,
        isSystem: true,
        priority: 70,
      },
      {
        name: PermissionType.USER_LIST,
        displayName: 'List Users',
        description: 'Can view list of all users',
        category: PermissionCategory.USER_MANAGEMENT,
        isSystem: true,
        priority: 95,
      },

      // Role Management
      {
        name: PermissionType.ROLE_CREATE,
        displayName: 'Create Roles',
        description: 'Can create new roles',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.ROLE_READ,
        displayName: 'Read Roles',
        description: 'Can view role information',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.ROLE_UPDATE,
        displayName: 'Update Roles',
        description: 'Can modify role information',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.ROLE_DELETE,
        displayName: 'Delete Roles',
        description: 'Can remove roles',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 70,
      },
      {
        name: PermissionType.ROLE_LIST,
        displayName: 'List Roles',
        description: 'Can view list of all roles',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 95,
      },
      {
        name: PermissionType.ROLE_ASSIGN,
        displayName: 'Assign Roles',
        description: 'Can assign roles to users',
        category: PermissionCategory.ROLE_MANAGEMENT,
        isSystem: true,
        priority: 85,
      },

      // Store Management
      {
        name: PermissionType.STORE_CREATE,
        displayName: 'Create Stores',
        description: 'Can create new stores',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.STORE_READ,
        displayName: 'Read Stores',
        description: 'Can view store information',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.STORE_UPDATE,
        displayName: 'Update Stores',
        description: 'Can modify store information',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.STORE_DELETE,
        displayName: 'Delete Stores',
        description: 'Can remove stores',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 70,
      },
      {
        name: PermissionType.STORE_LIST,
        displayName: 'List Stores',
        description: 'Can view list of all stores',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 95,
      },
      {
        name: PermissionType.STORE_MANAGE,
        displayName: 'Manage Stores',
        description: 'Can manage store operations',
        category: PermissionCategory.STORE_MANAGEMENT,
        isSystem: true,
        priority: 85,
      },

      // Product Management
      {
        name: PermissionType.PRODUCT_CREATE,
        displayName: 'Create Products',
        description: 'Can create new products',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.PRODUCT_READ,
        displayName: 'Read Products',
        description: 'Can view product information',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.PRODUCT_UPDATE,
        displayName: 'Update Products',
        description: 'Can modify product information',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.PRODUCT_DELETE,
        displayName: 'Delete Products',
        description: 'Can remove products',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 70,
      },
      {
        name: PermissionType.PRODUCT_LIST,
        displayName: 'List Products',
        description: 'Can view list of all products',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 95,
      },
      {
        name: PermissionType.PRODUCT_MANAGE,
        displayName: 'Manage Products',
        description: 'Can manage product operations',
        category: PermissionCategory.PRODUCT_MANAGEMENT,
        isSystem: true,
        priority: 85,
      },

      // Price Management
      {
        name: PermissionType.PRICE_CREATE,
        displayName: 'Create Prices',
        description: 'Can create new prices',
        category: PermissionCategory.PRICE_MANAGEMENT,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.PRICE_READ,
        displayName: 'Read Prices',
        description: 'Can view price information',
        category: PermissionCategory.PRICE_MANAGEMENT,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.PRICE_UPDATE,
        displayName: 'Update Prices',
        description: 'Can modify price information',
        category: PermissionCategory.PRICE_MANAGEMENT,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.PRICE_DELETE,
        displayName: 'Delete Prices',
        description: 'Can remove prices',
        category: PermissionCategory.PRICE_MANAGEMENT,
        isSystem: true,
        priority: 70,
      },
      {
        name: PermissionType.PRICE_LIST,
        displayName: 'List Prices',
        description: 'Can view list of all prices',
        category: PermissionCategory.PRICE_MANAGEMENT,
        isSystem: true,
        priority: 95,
      },

      // Analytics & Reports
      {
        name: PermissionType.ANALYTICS_READ,
        displayName: 'Read Analytics',
        description: 'Can view analytics data',
        category: PermissionCategory.ANALYTICS,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.REPORTS_GENERATE,
        displayName: 'Generate Reports',
        description: 'Can generate reports',
        category: PermissionCategory.ANALYTICS,
        isSystem: true,
        priority: 80,
      },
      {
        name: PermissionType.REPORTS_EXPORT,
        displayName: 'Export Reports',
        description: 'Can export reports',
        category: PermissionCategory.ANALYTICS,
        isSystem: true,
        priority: 70,
      },

      // System Administration
      {
        name: PermissionType.SYSTEM_CONFIG,
        displayName: 'System Configuration',
        description: 'Can configure system settings',
        category: PermissionCategory.SYSTEM_ADMIN,
        isSystem: true,
        priority: 100,
      },
      {
        name: PermissionType.SYSTEM_LOGS,
        displayName: 'System Logs',
        description: 'Can view system logs',
        category: PermissionCategory.SYSTEM_ADMIN,
        isSystem: true,
        priority: 90,
      },
      {
        name: PermissionType.SYSTEM_BACKUP,
        displayName: 'System Backup',
        description: 'Can perform system backups',
        category: PermissionCategory.SYSTEM_ADMIN,
        isSystem: true,
        priority: 80,
      },
    ];

    for (const permissionData of permissions) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: permissionData.name },
      });

      if (!existingPermission) {
        const permission = this.permissionRepository.create(permissionData);
        await this.permissionRepository.save(permission);
      }
    }
  }

  private async seedRoles(): Promise<void> {
    const roles = [
      {
        name: RoleType.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystem: true,
        priority: 1000,
        permissions: [
          PermissionType.USER_CREATE,
          PermissionType.USER_READ,
          PermissionType.USER_UPDATE,
          PermissionType.USER_DELETE,
          PermissionType.USER_LIST,
          PermissionType.ROLE_CREATE,
          PermissionType.ROLE_READ,
          PermissionType.ROLE_UPDATE,
          PermissionType.ROLE_DELETE,
          PermissionType.ROLE_LIST,
          PermissionType.ROLE_ASSIGN,
          PermissionType.STORE_CREATE,
          PermissionType.STORE_READ,
          PermissionType.STORE_UPDATE,
          PermissionType.STORE_DELETE,
          PermissionType.STORE_LIST,
          PermissionType.STORE_MANAGE,
          PermissionType.PRODUCT_CREATE,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_UPDATE,
          PermissionType.PRODUCT_DELETE,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRODUCT_MANAGE,
          PermissionType.PRICE_CREATE,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_UPDATE,
          PermissionType.PRICE_DELETE,
          PermissionType.PRICE_LIST,
          PermissionType.ANALYTICS_READ,
          PermissionType.REPORTS_GENERATE,
          PermissionType.REPORTS_EXPORT,
          PermissionType.SYSTEM_CONFIG,
          PermissionType.SYSTEM_LOGS,
          PermissionType.SYSTEM_BACKUP,
        ],
      },
      {
        name: RoleType.ADMIN,
        displayName: 'Administrator',
        description: 'System administrator with most permissions',
        isSystem: true,
        priority: 900,
        permissions: [
          PermissionType.USER_READ,
          PermissionType.USER_UPDATE,
          PermissionType.USER_LIST,
          PermissionType.ROLE_READ,
          PermissionType.ROLE_LIST,
          PermissionType.ROLE_ASSIGN,
          PermissionType.STORE_CREATE,
          PermissionType.STORE_READ,
          PermissionType.STORE_UPDATE,
          PermissionType.STORE_LIST,
          PermissionType.STORE_MANAGE,
          PermissionType.PRODUCT_CREATE,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_UPDATE,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRODUCT_MANAGE,
          PermissionType.PRICE_CREATE,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_UPDATE,
          PermissionType.PRICE_LIST,
          PermissionType.ANALYTICS_READ,
          PermissionType.REPORTS_GENERATE,
          PermissionType.REPORTS_EXPORT,
        ],
      },
      {
        name: RoleType.STORE_ADMIN,
        displayName: 'Store Administrator',
        description: 'Administrator of a specific store',
        isSystem: true,
        priority: 800,
        permissions: [
          PermissionType.USER_READ,
          PermissionType.USER_LIST,
          PermissionType.STORE_READ,
          PermissionType.STORE_UPDATE,
          PermissionType.STORE_MANAGE,
          PermissionType.PRODUCT_CREATE,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_UPDATE,
          PermissionType.PRODUCT_DELETE,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRODUCT_MANAGE,
          PermissionType.PRICE_CREATE,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_UPDATE,
          PermissionType.PRICE_DELETE,
          PermissionType.PRICE_LIST,
          PermissionType.ANALYTICS_READ,
          PermissionType.REPORTS_GENERATE,
        ],
      },
      {
        name: RoleType.STORE_MANAGER,
        displayName: 'Store Manager',
        description: 'Manager of store operations',
        isSystem: true,
        priority: 700,
        permissions: [
          PermissionType.USER_READ,
          PermissionType.STORE_READ,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_UPDATE,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_UPDATE,
          PermissionType.PRICE_LIST,
          PermissionType.ANALYTICS_READ,
        ],
      },
      {
        name: RoleType.STORE_EMPLOYEE,
        displayName: 'Store Employee',
        description: 'Employee with limited store access',
        isSystem: true,
        priority: 600,
        permissions: [
          PermissionType.STORE_READ,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_LIST,
        ],
      },
      {
        name: RoleType.CUSTOMER,
        displayName: 'Customer',
        description: 'Regular customer with basic access',
        isSystem: true,
        priority: 100,
        permissions: [
          PermissionType.STORE_READ,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_LIST,
        ],
      },
      {
        name: RoleType.GUEST,
        displayName: 'Guest',
        description: 'Guest user with minimal access',
        isSystem: true,
        priority: 50,
        permissions: [
          PermissionType.STORE_READ,
          PermissionType.PRODUCT_READ,
          PermissionType.PRODUCT_LIST,
          PermissionType.PRICE_READ,
          PermissionType.PRICE_LIST,
        ],
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
          priority: roleData.priority,
        });

        const savedRole = await this.roleRepository.save(role);

        // Assign permissions to role
        if (roleData.permissions) {
          const permissions = await this.permissionRepository.find({
            where: roleData.permissions.map((name) => ({ name })),
          });

          savedRole.permissions = permissions;
          await this.roleRepository.save(savedRole);
        }
      }
    }
  }
}
