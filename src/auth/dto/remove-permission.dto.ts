import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemovePermissionDto {
  @ApiProperty({ description: 'Permission ID to remove from the role' })
  @IsUUID()
  permissionId: string;
}
