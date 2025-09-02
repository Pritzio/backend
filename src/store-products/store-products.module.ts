import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreProductsController } from './controllers/store-products.controller';
import { StoreProductsService } from './services/store-products.service';
import { StoreProduct } from './entities/store-product.entity';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreProduct, Store, Product])],
  controllers: [StoreProductsController],
  providers: [StoreProductsService],
  exports: [StoreProductsService],
})
export class StoreProductsModule {}
