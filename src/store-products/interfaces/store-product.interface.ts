import {
  StoreProduct,
} from '../entities/store-product.entity';
import { ICategoryResponse } from './category.interface';

export interface IStoreProductResponse
  extends Omit<
    StoreProduct,
    'creator' | 'verifier' | 'categories'
  > {
  creatorId: string;
  creatorName: string;
  displayName: string;
  createdBy: string;
  categories: ICategoryResponse[];
}

export interface IStoreProductSummary {
  id: string;
  name: string;
  description?: string;
  url?: string;
  sku?: string;
  storeProductId?: string;
  image?: string;
  lastScraped?: Date;
  createdAt: Date;
  creatorName: string;
  categories: ICategoryResponse[];
}

export interface IStoreProductFilter {
  search?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IStoreProductSearchResult {
  data: IStoreProductResponse[];
  total: number;
  page: number;
  limit: number;
}