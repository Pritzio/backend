import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../entities/permission.entity';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
