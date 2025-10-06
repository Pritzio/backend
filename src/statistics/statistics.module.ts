import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './controllers/statistics.controller';
import { StatisticsService } from './services/statistics.service';
import { User } from '../auth/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { StoreProduct } from '../store-products/entities/store-product.entity';
import { Category } from '../store-products/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store, Product, StoreProduct, Category]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
