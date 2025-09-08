import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreProductsController } from './controllers/store-products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { StoreProductsService } from './services/store-products.service';
import { CategoriesService } from './services/categories.service';
import { StoreProduct } from './entities/store-product.entity';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { PhysicalLocation } from '../physical-locations/entities/physical-location.entity';
import { StoresService } from '../stores/services/stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreProduct, Category, Store, PhysicalLocation])],
  controllers: [StoreProductsController, CategoriesController],
  providers: [StoreProductsService, CategoriesService, StoresService],
  exports: [StoreProductsService, CategoriesService],
})
export class StoreProductsModule {}
