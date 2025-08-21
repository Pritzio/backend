import { StoreProduct, StoreProductStatus, Availability, ScrapingStatus } from '../entities/store-product.entity';

export interface IStoreProductResponse extends Omit<StoreProduct, 'store' | 'product' | 'creator' | 'verifier' | 'isActive' | 'hasOnlinePrice' | 'hasPhysicalPrice' | 'hasDiscount' | 'discountAmount' | 'calculatedDiscountPercentage' | 'isLowStock' | 'isOutOfStock' | 'needsScraping' | 'scrapingOverdue' | 'displayName' | 'bestPrice' | 'priceType' | 'lastPriceChange' | 'priceVolatility'> {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productCode: string;
  creatorId: string;
  creatorName: string;
  verifierId?: string;
  verifierName?: string;
}

export interface IStoreProductSummary {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productCode: string;
  onlinePrice: number;
  physicalPrice: number;
  currency: string;
  availability: Availability;
  status: StoreProductStatus;
  image: string;
  isOnSale: boolean;
  discountPercentage: number;
  lastScraped: Date;
  createdAt: Date;
}

export interface IStoreProductFilter {
  search?: string;
  storeId?: string;
  productId?: string;
  status?: StoreProductStatus;
  availability?: Availability;
  scrapingStatus?: ScrapingStatus;
  hasOnlinePrice?: boolean;
  hasPhysicalPrice?: boolean;
  isOnSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  minStock?: number;
  maxStock?: number;
  needsScraping?: boolean;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastScrapedAfter?: Date;
  lastScrapedBefore?: Date;
}

export interface IStoreProductAnalytics {
  totalStoreProducts: number;
  activeStoreProducts: number;
  inactiveStoreProducts: number;
  outOfStockProducts: number;
  productsByStatus: Record<StoreProductStatus, number>;
  productsByAvailability: Record<Availability, number>;
  productsByScrapingStatus: Record<ScrapingStatus, number>;
  averageOnlinePrice: number;
  averagePhysicalPrice: number;
  totalOnSaleProducts: number;
  averageDiscountPercentage: number;
  productsNeedingScraping: number;
  productsOverdueScraping: number;
  topStores: Array<{ storeId: string; storeName: string; productCount: number }>;
  topProducts: Array<{ productId: string; productName: string; storeCount: number }>;
  recentScrapingActivity: Array<{ storeProductId: string; status: ScrapingStatus; timestamp: Date }>;
  priceChangeTrends: Array<{ date: string; averagePrice: number; productCount: number }>;
}

export interface IStoreProductSearchResult {
  storeProducts: IStoreProductSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IScrapingJob {
  id: string;
  storeProductId: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  url: string;
  status: ScrapingStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface IScrapingResult {
  storeProductId: string;
  status: ScrapingStatus;
  onlinePrice?: number;
  physicalPrice?: number;
  availability?: Availability;
  stockQuantity?: number;
  isOnSale?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  saleEndDate?: Date;
  error?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface IPriceHistoryEntry {
  timestamp: Date;
  price: number;
  currency: string;
  type: 'online' | 'physical';
  source: 'scraping' | 'manual';
  storeProductId: string;
}

export interface IAvailabilityHistoryEntry {
  timestamp: Date;
  availability: Availability;
  stockQuantity?: number;
  source: 'scraping' | 'manual';
  storeProductId: string;
}

export interface IScrapingHistoryEntry {
  timestamp: Date;
  status: ScrapingStatus;
  price?: number;
  availability?: Availability;
  stockQuantity?: number;
  error?: string;
  responseTime?: number;
  storeProductId: string;
}
