import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Permission ID to assign to the role' })
  @IsUUID()
  permissionId: string;
}
