import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysicalLocationsController } from './controllers/physical-locations.controller';
import { PhysicalLocationsService } from './services/physical-locations.service';
import { PhysicalLocation } from './entities/physical-location.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../auth/entities/user.entity';
import { StoreProduct } from '../store-products/entities/store-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhysicalLocation, Store, User, StoreProduct]),
  ],
  controllers: [PhysicalLocationsController],
  providers: [PhysicalLocationsService],
  exports: [PhysicalLocationsService],
})
export class PhysicalLocationsModule {}
