import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreProductsController } from './controllers/store-products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ProductComparisonController } from './controllers/product-comparison.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { SimilarityController } from './controllers/similarity.controller';
import { StoreProductsService } from './services/store-products.service';
import { CategoriesService } from './services/categories.service';
import { ProductMatchingService } from './services/product-matching.service';
import { StoreProduct } from './entities/store-product.entity';
import { Category } from './entities/category.entity';
import { BaseProduct } from './entities/base-product.entity';
import { Store } from '../stores/entities/store.entity';
import { PhysicalLocation } from '../physical-locations/entities/physical-location.entity';
import { StoresService } from '../stores/services/stores.service';
import {
  ProductNormalizationService,
  ProductSimilarityService,
} from './services/product-matching';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreProduct,
      Category,
      BaseProduct,
      Store,
      PhysicalLocation,
    ]),
  ],
  controllers: [
    StoreProductsController,
    CategoriesController,
    ProductComparisonController,
    AdminProductsController,
    SimilarityController,
  ],
  providers: [
    StoreProductsService,
    CategoriesService,
    ProductMatchingService,
    StoresService,
    ProductNormalizationService,
    ProductSimilarityService,
  ],
  exports: [StoreProductsService, CategoriesService, ProductMatchingService],
})
export class StoreProductsModule {}
