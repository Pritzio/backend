import { PartialType } from '@nestjs/swagger';
import { CreateStoreLocationDto } from './create-physical-location.dto';

export class UpdateStoreLocationDto extends PartialType(
  CreateStoreLocationDto,
) {}
