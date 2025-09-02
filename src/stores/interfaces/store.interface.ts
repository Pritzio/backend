import {
  Store,
  StoreType,
  StoreStatus,
  StoreCategory,
} from '../entities/store.entity';
import { PhysicalLocation } from '../entities/physical-location.entity';
import { StoreProduct } from '../entities/store-product.entity';

export interface IStoreResponse
  extends Omit<
    Store,
    | 'creator'
    | 'storeProducts'
    | 'physicalLocations'
    | 'isActive'
    | 'hasPhysicalLocations'
    | 'isOnlineOnly'
    | 'displayName'
    | 'storeTypeDisplay'
    | 'statusDisplay'
  > {
  creator: {
    id: string;
    username: string;
    email: string;
    roles: Array<{
      id: string;
      name: string;
      displayName: string;
    }>;
  };
  storeProductsCount: number;
  physicalLocationsCount: number;
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'suspended';
}

export interface IStoreSummary {
  id: string;
  name: string;
  website: string;
  logo?: string;
  type: StoreType;
  status: StoreStatus;
  category: StoreCategory;
  country?: string;
  isVerified: boolean;
  storeProductsCount: number;
  physicalLocationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreWithLocations extends IStoreResponse {
  physicalLocations: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
    phone?: string;
    hours?: string;
    status: string;
    isActive: boolean;
  }>;
}

export interface IStoreWithProducts extends IStoreResponse {
  storeProducts: Array<{
    id: string;
    name: string;
    url: string;
    onlinePrice: number;
    physicalPrice?: number;
    currency: string;
    availability: string;
    status: string;
    lastScraped?: Date;
    isActive: boolean;
  }>;
}

export interface IStoreAnalytics {
  id: string;
  name: string;
  totalProducts: number;
  activeProducts: number;
  totalLocations: number;
  activeLocations: number;
  averageOnlinePrice: number;
  averagePhysicalPrice?: number;
  priceComparison: {
    onlineOnly: number;
    physicalOnly: number;
    both: number;
    priceDifference: number;
  };
  lastActivity: Date;
  scrapingStatus: {
    lastScraped: Date;
    productsNeedingScraping: number;
    scrapingErrors: number;
  };
}

export interface IStoreSearchResult {
  id: string;
  name: string;
  website: string;
  type: StoreType;
  category: StoreCategory;
  country?: string;
  isVerified: boolean;
  relevanceScore: number;
  matchReason: string;
}

export interface IStoreFilters {
  type?: StoreType;
  status?: StoreStatus;
  category?: StoreCategory;
  country?: string;
  isVerified?: boolean;
  hasPhysicalLocations?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface IStorePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IStoreListResponse {
  stores: IStoreSummary[];
  pagination: IStorePagination;
  filters: IStoreFilters;
}
