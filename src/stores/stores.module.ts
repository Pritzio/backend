import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresController } from './controllers/stores.controller';
import { StoresService } from './services/stores.service';
import { Store } from './entities/store.entity';
import { PhysicalLocation } from './entities/physical-location.entity';
import { StoreProduct } from './entities/store-product.entity';
import { StoresSeeder } from './seeders/stores.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      PhysicalLocation,
      StoreProduct,
    ]),
  ],
  controllers: [StoresController],
  providers: [StoresService, StoresSeeder],
  exports: [StoresService, StoresSeeder],
})
export class StoresModule {}
