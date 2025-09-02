import { PartialType } from '@nestjs/swagger';
import { CreatePhysicalLocationDto } from './create-physical-location.dto';

export class UpdatePhysicalLocationDto extends PartialType(
  CreatePhysicalLocationDto,
) {}
