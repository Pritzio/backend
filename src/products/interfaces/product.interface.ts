import {
  Product,
  ProductStatus,
  ProductType,
  ProductCondition,
} from '../entities/product.entity';

export interface IProductResponse
  extends Omit<
    Product,
    | 'creator'
    | 'isActive'
    | 'isAvailable'
    | 'isDiscontinued'
    | 'displayName'
    | 'fullCode'
    | 'hasWarranty'
    | 'hasDimensions'
    | 'hasWeight'
    | 'isPhysical'
    | 'isDigital'
    | 'isService'
    | 'isSubscription'
  > {
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
}

export interface IProductSummary {
  id: string;
  name: string;
  code: string;
  brand: string;
  category: string;
  type: ProductType;
  status: ProductStatus;
  image: string;
  createdAt: Date;
}

export interface IProductFilter {
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  type?: ProductType;
  status?: ProductStatus;
  condition?: ProductCondition;
  hasWarranty?: boolean;
  hasDimensions?: boolean;
  hasWeight?: boolean;
  minWeight?: number;
  maxWeight?: number;
  minWarranty?: number;
  maxWarranty?: number;
  tags?: string[];
  features?: string[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  discontinuedProducts: number;
  productsByType: Record<ProductType, number>;
  productsByStatus: Record<ProductStatus, number>;
  productsByCategory: Record<string, number>;
  productsByBrand: Record<string, number>;
  averageWarranty: number;
  productsWithWarranty: number;
  productsWithDimensions: number;
  productsWithWeight: number;
  topCategories: Array<{ category: string; count: number }>;
  topBrands: Array<{ brand: string; count: number }>;
  recentProducts: IProductSummary[];
  productsCreatedThisMonth: number;
  productsCreatedThisYear: number;
}

export interface IProductSearchResult {
  products: IProductSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IProductBulkOperationInput {
  productIds: string[];
  operation: 'activate' | 'deactivate' | 'discontinue' | 'delete' | 'update';
  data?: Partial<IProductResponse>;
}

export interface IProductBulkOperation extends IProductBulkOperationInput {
  successCount: number;
  errorCount: number;
  errors: Array<{ productId: string; error: string }>;
}
