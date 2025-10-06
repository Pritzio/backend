import { StoreProduct } from '../entities/store-product.entity';
import { ICategoryResponse } from './category.interface';

export interface IStoreResponse {
  id: string;
  name: string;
  website?: string;
  type: string;
  status: string;
  category: string;
  isVerified: boolean;
  displayName: string;
}

export interface IStoreProductResponse
  extends Omit<
    StoreProduct,
    | 'creator'
    | 'verifier'
    | 'categories'
    | 'store'
    | 'storeId'
    | 'price'
    | 'createdAt'
    | 'updatedAt'
    | 'lastScraped'
    | 'baseProduct'
    | 'baseProductId'
  > {
  creatorId: string;
  creatorName: string;
  displayName: string;
  createdBy: string;
  storeId?: string;
  store?: IStoreResponse;
  price?: number;
  categories: ICategoryResponse[];
  baseProductId?: string | null;
  baseProduct?: {
    id: string;
    name: string;
    brand?: string;
    model?: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  lastScraped?: string;
}

export interface IStoreProductSummary {
  id: string;
  name: string;
  description?: string;
  url?: string;
  sku?: string;
  storeProductId?: string;
  image?: string;
  price?: number;
  lastScraped?: string;
  createdAt: string;
  creatorName: string;
  categories: ICategoryResponse[];
}

export interface IStoreProductFilter {
  search?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  storeId?: string;
}

export interface IStoreProductSearchResult {
  data: IStoreProductResponse[];
  total: number;
  page: number;
  limit: number;
}
