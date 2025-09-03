import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreProductsController } from './controllers/store-products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { StoreProductsService } from './services/store-products.service';
import { CategoriesService } from './services/categories.service';
import { StoreProduct } from './entities/store-product.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreProduct, Category])],
  controllers: [StoreProductsController, CategoriesController],
  providers: [StoreProductsService, CategoriesService],
  exports: [StoreProductsService, CategoriesService],
})
export class StoreProductsModule {}
