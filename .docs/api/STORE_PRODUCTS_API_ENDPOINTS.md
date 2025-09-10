# 🏪 Store Products API - Endpoints Documentation

*This document provides comprehensive API documentation for the Store Products module, including all endpoints, request/response formats, and practical examples for store product management and price comparison.*

*Last updated: 2025-01-27*
*API Version: 2.1*

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Integration Examples](#integration-examples)

## 🎯 Overview

The Store Products API manages the relationship between products and stores, enabling price comparison and inventory tracking across multiple retail locations. Key features:

- **Store-Product Relationships**: Link products to specific stores with pricing
- **Price Comparison**: Compare prices across different stores
- **Inventory Tracking**: Monitor product availability and stock levels
- **Scraping Integration**: Automated price updates from web scraping
- **Bulk Operations**: Efficient management of multiple store products
- **Analytics**: Track store performance and product trends

## 🔐 Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Required Roles

- **Read Endpoints**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`
- **Write Endpoints**: `SUPER_ADMIN`, `ADMIN`
- **Scraping Endpoints**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

## 🌐 Base URL

```
http://localhost:3000/api/v1/store-products
```

## 🚀 Endpoints

### Get All Store Products

**GET** `/api/v1/store-products`

Retrieves all store products with filtering and pagination.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `search` (string): Search term for product name or description
- `storeId` (string): Filter by store ID
- `category` (string): Filter by product category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `isActive` (boolean): Filter by active status
- `lastScrapedAfter` (ISO string): Filter by last scraped date
- `sortBy` (string): Sort field (name, price, lastScraped, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

**Example Request**:
```bash
GET /api/v1/store-products?page=1&limit=20&search=nova%20papel&minPrice=1000&maxPrice=3000
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid-store-product-id",
      "name": "Nova Papel 70m",
      "description": "Papel higiénico Nova 70 metros",
      "url": "https://jumbo.cl/nova-papel-70m",
      "sku": "NOVA-70M-001",
      "storeProductId": "jumbo-12345",
      "image": "https://jumbo.cl/images/nova-papel-70m.jpg",
      "price": 1500,
      "metadata": {
        "brand": "Nova",
        "rating": 4.5,
        "ratingText": "Excelente",
        "ppum": 21.43,
        "highResImageUrl": "https://jumbo.cl/images/nova-papel-70m-hd.jpg",
        "categories": ["Hogar y Jardín", "Higiene Personal"],
        "originalPrice": 1500,
        "originalData": {}
      },
      "lastScraped": "2025-01-27T10:30:00.000Z",
      "notes": "Product added from scraping - 2025-01-27T10:30:00.000Z",
      "createdAt": "2025-01-27T10:30:00.000Z",
      "updatedAt": "2025-01-27T10:30:00.000Z",
      "creatorId": "uuid-user-id",
      "creatorName": "Admin User",
      "displayName": "Nova Papel 70m",
      "createdBy": "uuid-user-id",
      "storeId": "uuid-store-id",
      "baseProductId": "uuid-base-product-id",
      "baseProduct": {
        "id": "uuid-base-product-id",
        "name": "nova papel 70m",
        "brand": "nova",
        "model": "70m",
        "fullName": "nova nova papel 70m 70m"
      },
      "store": {
        "id": "uuid-store-id",
        "name": "Jumbo",
        "website": "https://jumbo.cl",
        "type": "online",
        "status": "active",
        "category": "supermarket",
        "isVerified": true,
        "displayName": "Jumbo"
      },
      "categories": [
        {
          "id": "uuid-category-id",
          "name": "Hogar y Jardín",
          "description": "Productos para el hogar y jardín",
          "color": "#10B981",
          "icon": "home",
          "isActive": true,
          "productCount": 150,
          "createdAt": "2025-01-27T10:30:00.000Z",
          "updatedAt": "2025-01-27T10:30:00.000Z",
          "displayName": "Hogar y Jardín"
        }
      ],
      "physicalLocations": []
    }
  ],
  "pagination": {
  "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "search": "nova papel",
    "minPrice": 1000,
    "maxPrice": 3000,
    "storeId": null,
    "category": null,
    "isActive": null
  }
}
```

### Get Store Product by ID

**GET** `/api/v1/store-products/{id}`

Retrieves a specific store product by ID.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string): Store product ID

**Response** (200 OK): Same as single item in "Get All Store Products"

**Error Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Store product with ID 'uuid' not found",
  "error": "Not Found"
}
```

### Create Store Product

**POST** `/api/v1/store-products`

Creates a new store product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Request Body**:
```json
{
  "name": "Nova Papel 70m",
  "description": "Papel higiénico Nova 70 metros",
  "url": "https://jumbo.cl/nova-papel-70m",
  "sku": "NOVA-70M-001",
  "storeProductId": "jumbo-12345",
  "image": "https://jumbo.cl/images/nova-papel-70m.jpg",
  "price": 1500,
  "metadata": {
    "brand": "Nova",
    "rating": 4.5,
    "ratingText": "Excelente",
    "ppum": 21.43,
    "highResImageUrl": "https://jumbo.cl/images/nova-papel-70m-hd.jpg",
    "categories": ["Hogar y Jardín", "Higiene Personal"],
    "originalPrice": 1500
  },
  "notes": "Product added manually",
  "storeId": "uuid-store-id",
  "baseProductId": "uuid-base-product-id",
  "categoryNames": ["Hogar y Jardín", "Higiene Personal"]
}
```

**Response** (201 Created): Same as single item in "Get All Store Products"

### Update Store Product

**PUT** `/api/v1/store-products/{id}`

Updates an existing store product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string): Store product ID

**Request Body**: Same as create, but all fields optional

**Response** (200 OK): Updated store product object

### Delete Store Product

**DELETE** `/api/v1/store-products/{id}`

Deletes a store product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string): Store product ID

**Response** (200 OK):
```json
{
  "message": "Store product deleted successfully"
}
```

### Add Scraped Products ⭐ NEW

**POST** `/api/v1/store-products/scraping/add-products`

Adds multiple products from scraping with automatic matching.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**:
```json
[
  {
    "name": "Nova Papel 70m",
    "brand": "Nova",
    "store": "Jumbo",
    "storeWebsite": "https://jumbo.cl",
    "price": 1500,
    "url": "https://jumbo.cl/nova-papel-70m",
    "imageUrl": "https://jumbo.cl/images/nova-papel-70m.jpg",
    "description": "Papel higiénico Nova 70 metros",
    "categories": ["Hogar y Jardín", "Higiene Personal"],
    "rating": 4.5,
    "ratingText": "Excelente",
    "ppum": 21.43,
    "id": "jumbo-12345"
  },
  {
    "name": "NOVA PAPEL 70 METROS",
    "brand": "NOVA",
    "store": "Lider",
    "storeWebsite": "https://lider.cl",
    "price": 1800,
    "url": "https://lider.cl/nova-papel-70-metros",
    "imageUrl": "https://lider.cl/images/nova-papel-70-metros.jpg",
    "description": "Papel higiénico Nova 70 metros",
    "categories": ["Hogar y Jardín", "Higiene Personal"],
    "rating": 4.2,
    "ratingText": "Muy bueno",
    "ppum": 25.71,
    "id": "lider-67890"
  }
]
```

**Response** (201 Created):
```json
{
  "message": "Scraped products processed with automatic matching",
  "total": 2,
  "successful": 2,
  "failed": 0,
  "matched": 2,
  "newBaseProducts": 1,
  "results": [
    {
      "success": true,
      "originalId": "jumbo-12345",
      "createdProduct": {
        "id": "uuid-store-product-id-1",
        "name": "Nova Papel 70m",
        "price": 1500,
        "storeId": "uuid-store-id-1"
      },
      "matchedBaseProduct": {
        "id": "uuid-base-product-id",
        "name": "nova papel 70m",
        "brand": "nova"
      }
    },
    {
      "success": true,
      "originalId": "lider-67890",
      "createdProduct": {
        "id": "uuid-store-product-id-2",
        "name": "NOVA PAPEL 70 METROS",
        "price": 1800,
        "storeId": "uuid-store-id-2"
      },
      "matchedBaseProduct": {
        "id": "uuid-base-product-id",
        "name": "nova papel 70m",
        "brand": "nova"
      }
    }
  ],
  "logs": {
    "endpoint": "store-products/scraping/add-products",
    "timestamp": "2025-01-27T10:30:00.000Z",
    "user": "admin",
    "matchingStrategy": "automatic-similarity-based"
  }
}
```

### Get Price Comparison

**GET** `/api/v1/store-products/price-comparison/{baseProductId}`

Gets price comparison for a specific base product across all stores.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `baseProductId` (string): Base product ID

**Query Parameters**:
- `currency` (string, optional): Currency code (default: CLP)
- `sortBy` (string, optional): Sort by (price, store, lastScraped)
- `sortOrder` (string, optional): Sort order (asc, desc)

**Response** (200 OK):
```json
{
  "baseProduct": {
    "id": "uuid-base-product-id",
    "name": "nova papel 70m",
    "brand": "nova",
    "model": "70m",
    "fullName": "nova nova papel 70m 70m",
    "description": "Papel higiénico Nova 70 metros",
    "image": "https://example.com/nova-papel-70m.jpg",
    "specifications": {
      "material": "papel",
      "longitud": "70 metros",
      "hojas": 280
    },
    "storeCount": 3,
    "totalVariants": 5
  },
  "priceRange": {
    "min": 1500,
    "max": 2200,
    "avg": 1850,
    "currency": "CLP"
  },
  "stores": [
    {
      "store": {
        "id": "uuid-store-id-1",
        "name": "Jumbo",
        "website": "https://jumbo.cl",
        "type": "online",
        "isVerified": true
      },
      "product": {
        "id": "uuid-store-product-id-1",
        "name": "Nova Papel 70m",
        "price": 1500,
        "url": "https://jumbo.cl/nova-papel-70m",
        "image": "https://jumbo.cl/images/nova-papel-70m.jpg",
        "lastScraped": "2025-01-27T10:30:00.000Z"
      },
      "price": 1500,
      "savings": 700,
      "savingsPercent": 31.8
    },
    {
      "store": {
        "id": "uuid-store-id-2",
        "name": "Lider",
        "website": "https://lider.cl",
        "type": "online",
        "isVerified": true
      },
      "product": {
        "id": "uuid-store-product-id-2",
        "name": "NOVA PAPEL 70 METROS",
        "price": 1800,
        "url": "https://lider.cl/nova-papel-70-metros",
        "image": "https://lider.cl/images/nova-papel-70-metros.jpg",
        "lastScraped": "2025-01-27T09:15:00.000Z"
      },
      "price": 1800,
      "savings": 400,
      "savingsPercent": 18.2
    },
    {
      "store": {
        "id": "uuid-store-id-3",
        "name": "Santa Isabel",
        "website": "https://santaisabel.cl",
        "type": "online",
        "isVerified": false
      },
      "product": {
        "id": "uuid-store-product-id-3",
        "name": "Nova Papel 70m",
        "price": 2200,
        "url": "https://santaisabel.cl/nova-papel-70m",
        "image": "https://santaisabel.cl/images/nova-papel-70m.jpg",
        "lastScraped": "2025-01-27T08:45:00.000Z"
      },
      "price": 2200,
      "savings": 0,
      "savingsPercent": 0
    }
  ],
  "totalStores": 3,
  "lastUpdated": "2025-01-27T10:30:00.000Z"
}
```

### Get Store Products Analytics

**GET** `/api/v1/store-products/analytics`

Gets analytics and statistics for store products.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `storeId` (string, optional): Filter by store ID
- `category` (string, optional): Filter by category
- `dateFrom` (ISO string, optional): Start date for analytics
- `dateTo` (ISO string, optional): End date for analytics

**Response** (200 OK):
```json
{
  "overview": {
    "totalProducts": 1250,
    "activeProducts": 1100,
    "inactiveProducts": 100,
    "totalStores": 15,
    "totalCategories": 25,
    "averagePrice": 2500,
    "lastUpdated": "2025-01-27T10:30:00.000Z"
  },
  "priceDistribution": {
    "under1000": 150,
    "1000to2000": 400,
    "2000to3000": 350,
    "3000to5000": 200,
    "over5000": 150
  },
  "storePerformance": [
    {
      "storeId": "uuid-store-id-1",
      "storeName": "Jumbo",
      "productCount": 800,
      "averagePrice": 2200,
      "bestPrices": 120,
      "lastScraped": "2025-01-27T10:30:00.000Z"
    }
  ],
  "categoryBreakdown": [
    {
      "category": "Hogar y Jardín",
      "productCount": 300,
      "averagePrice": 1800,
      "storeCount": 12
    }
  ],
  "recentActivity": {
    "productsAddedToday": 25,
    "productsUpdatedToday": 150,
    "priceChangesToday": 80,
    "newStoresToday": 2
  }
}
```

### Bulk Operations

#### **Bulk Activate Store Products**
**POST** `/api/v1/store-products/bulk/activate`

**Request Body**:
```json
{
  "storeProductIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Deactivate Store Products**
**POST** `/api/v1/store-products/bulk/deactivate`

**Request Body**:
```json
{
  "storeProductIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Update Store Products**
**POST** `/api/v1/store-products/bulk/update`

**Request Body**:
```json
{
  "storeProductIds": ["uuid-1", "uuid-2", "uuid-3"],
  "data": {
  "isActive": true,
    "notes": "Bulk updated"
  }
}
```

#### **Bulk Delete Store Products**
**POST** `/api/v1/store-products/bulk/delete`

**Request Body**:
```json
{
  "storeProductIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response for Bulk Operations**:
```json
{
  "message": "Bulk operation completed successfully",
  "updated": 3,
  "failed": 0,
  "total": 3,
  "results": [
    {
      "id": "uuid-1",
      "success": true,
      "error": null
    },
    {
      "id": "uuid-2",
      "success": true,
      "error": null
    },
    {
      "id": "uuid-3",
      "success": true,
      "error": null
    }
  ]
}
```

## 📊 Data Models

### IStoreProductResponse
```typescript
interface IStoreProductResponse {
  id: string;                      // UUID
  name: string;                    // Product name
  description?: string;            // Product description
  url?: string;                    // Product URL
  sku?: string;                    // SKU
  storeProductId?: string;         // External store product ID
  image?: string;                  // Product image URL
  price?: number;                  // Product price
  metadata: Record<string, any>;   // Additional metadata
  lastScraped?: string;            // Last scraped timestamp
  notes?: string;                  // Notes
  createdAt: string;               // Creation timestamp
  updatedAt: string;               // Last update timestamp
  creatorId: string;               // Creator user ID
  creatorName: string;             // Creator name
  displayName: string;             // Display name
  createdBy: string;               // Created by user ID
  storeId?: string;                // Store ID
  baseProductId?: string;          // Base product ID
  baseProduct?: {                  // Base product info
    id: string;
    name: string;
    brand?: string;
    model?: string;
    fullName: string;
  };
  store?: {                        // Store info
    id: string;
    name: string;
    website?: string;
    type: string;
    status: string;
    category?: string;
    isVerified: boolean;
    displayName: string;
  };
  categories: ICategoryResponse[]; // Product categories
  physicalLocations: PhysicalLocation[]; // Physical locations
}
```

### ICreateStoreProductDto
```typescript
interface ICreateStoreProductDto {
  name: string;                    // Product name (required)
  description?: string;            // Product description
  url?: string;                    // Product URL
  sku?: string;                    // SKU
  storeProductId?: string;         // External store product ID
  image?: string;                  // Product image URL
  price?: number;                  // Product price
  metadata?: Record<string, any>;  // Additional metadata
  notes?: string;                  // Notes
  storeId?: string;                // Store ID
  baseProductId?: string;          // Base product ID
  categoryNames?: string[];        // Category names
}
```

### IPriceComparison
```typescript
interface IPriceComparison {
  baseProduct: {
    id: string;
    name: string;
    brand?: string;
    model?: string;
    fullName: string;
    description?: string;
    image?: string;
    specifications?: Record<string, any>;
    storeCount: number;
    totalVariants: number;
  };
  priceRange: {
    min: number;
    max: number;
    avg: number;
    currency: string;
  };
  stores: Array<{
    store: {
      id: string;
      name: string;
      website: string;
      type: string;
      isVerified: boolean;
    };
    product: {
      id: string;
      name: string;
      price: number;
      url?: string;
      image?: string;
      lastScraped?: string;
    };
    price: number;
    savings: number;
    savingsPercent: number;
  }>;
  totalStores: number;
  lastUpdated: string;
}
```

## ⚠️ Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Store product with ID 'uuid' not found",
  "error": "Not Found"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Store product with storeProductId 'jumbo-12345' already exists",
  "error": "Conflict"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## 🚦 Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes per IP
- **Scraping endpoints**: 50 requests per 15 minutes per IP
- **Bulk operations**: 20 requests per 15 minutes per IP

## 🔗 Integration Examples

### Frontend Integration (React/Next.js)

```typescript
// Store products API service
class StoreProductsAPI {
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
    headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
    },
      ...options
  });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

  return response.json();
  }

  // Get store products with filters
  async getStoreProducts(filters: {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request(`?${params.toString()}`);
  }

  // Get store product by ID
  async getStoreProduct(id: string) {
    return this.request(`/${id}`);
  }

  // Create store product
  async createStoreProduct(data: ICreateStoreProductDto) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Update store product
  async updateStoreProduct(id: string, data: Partial<ICreateStoreProductDto>) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Delete store product
  async deleteStoreProduct(id: string) {
    return this.request(`/${id}`, {
      method: 'DELETE'
    });
  }

  // Add scraped products
  async addScrapedProducts(products: any[]) {
    return this.request('/scraping/add-products', {
      method: 'POST',
      body: JSON.stringify(products)
    });
  }

  // Get price comparison
  async getPriceComparison(baseProductId: string, options: {
    currency?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return this.request(`/price-comparison/${baseProductId}?${params.toString()}`);
  }

  // Get analytics
  async getAnalytics(filters: {
    storeId?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return this.request(`/analytics?${params.toString()}`);
  }

  // Bulk operations
  async bulkActivate(storeProductIds: string[]) {
    return this.request('/bulk/activate', {
      method: 'POST',
      body: JSON.stringify({ storeProductIds })
    });
  }

  async bulkDeactivate(storeProductIds: string[]) {
    return this.request('/bulk/deactivate', {
      method: 'POST',
      body: JSON.stringify({ storeProductIds })
    });
  }

  async bulkUpdate(storeProductIds: string[], data: any) {
    return this.request('/bulk/update', {
      method: 'POST',
      body: JSON.stringify({ storeProductIds, data })
    });
  }

  async bulkDelete(storeProductIds: string[]) {
    return this.request('/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ storeProductIds })
    });
  }
}

// Usage
const api = new StoreProductsAPI('http://localhost:3000/api/v1/store-products', token);

// Get store products
const products = await api.getStoreProducts({
  page: 1,
  limit: 20,
  search: 'nova papel',
  minPrice: 1000,
  maxPrice: 3000
});

// Get price comparison
const comparison = await api.getPriceComparison('uuid-base-product-id', {
  currency: 'CLP',
  sortBy: 'price',
  sortOrder: 'asc'
});

// Add scraped products
const scrapedProducts = [
  {
    name: 'Nova Papel 70m',
    brand: 'Nova',
    store: 'Jumbo',
    price: 1500,
    url: 'https://jumbo.cl/nova-papel-70m',
    categories: ['Hogar y Jardín']
  }
];

const result = await api.addScrapedProducts(scrapedProducts);
```

### React Hook Example
```typescript
import { useState, useEffect, useCallback } from 'react';

const useStoreProducts = (api: StoreProductsAPI) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getStoreProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createProduct = useCallback(async (data) => {
    try {
      const product = await api.createStoreProduct(data);
      setProducts(prev => [product, ...prev]);
      return product;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  const updateProduct = useCallback(async (id, data) => {
    try {
      const product = await api.updateStoreProduct(id, data);
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      return product;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  const deleteProduct = useCallback(async (id) => {
    try {
      await api.deleteStoreProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
```

### Vue.js Example
```javascript
// Vue 3 Composition API
import { ref, computed } from 'vue';

export function useStoreProducts(api) {
  const products = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref(null);

  const fetchProducts = async (filters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getStoreProducts(filters);
      products.value = response.data;
      pagination.value = response.pagination;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (data) => {
    try {
      const product = await api.createStoreProduct(data);
      products.value.unshift(product);
      return product;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const updateProduct = async (id, data) => {
    try {
      const product = await api.updateStoreProduct(id, data);
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = product;
      }
      return product;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.deleteStoreProduct(id);
      products.value = products.value.filter(p => p.id !== id);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const sortedProducts = computed(() => {
    return [...products.value].sort((a, b) => {
      if (a.price && b.price) {
        return a.price - b.price;
      }
      return a.name.localeCompare(b.name);
    });
  });

  return {
    products,
    loading,
    error,
    pagination,
    sortedProducts,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
}
```

### Mobile App Integration

```dart
// Flutter/Dart example
class StoreProductsService {
  static const String baseUrl = 'http://localhost:3000/api/v1/store-products';
  
  Future<List<StoreProduct>> getStoreProducts({
    int page = 1,
    int limit = 20,
    String? search,
    String? storeId,
    String? category,
    double? minPrice,
    double? maxPrice,
    bool? isActive,
    String? sortBy,
    String? sortOrder,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (search != null) params['search'] = search;
    if (storeId != null) params['storeId'] = storeId;
    if (category != null) params['category'] = category;
    if (minPrice != null) params['minPrice'] = minPrice.toString();
    if (maxPrice != null) params['maxPrice'] = maxPrice.toString();
    if (isActive != null) params['isActive'] = isActive.toString();
    if (sortBy != null) params['sortBy'] = sortBy;
    if (sortOrder != null) params['sortOrder'] = sortOrder;
    
    final uri = Uri.parse(baseUrl).replace(queryParameters: params);
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => StoreProduct.fromJson(json))
          .toList();
    }
    throw Exception('Failed to load store products');
  }
  
  Future<StoreProduct> getStoreProduct(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$id'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return StoreProduct.fromJson(data);
    }
    throw Exception('Failed to load store product');
  }
  
  Future<PriceComparison> getPriceComparison(String baseProductId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/price-comparison/$baseProductId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PriceComparison.fromJson(data);
    }
    throw Exception('Failed to load price comparison');
  }
}
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Price comparisons are sorted by price (ascending) by default
- Store verification status affects display priority
- Scraping endpoints automatically create stores if they don't exist
- Base product matching uses similarity algorithms for automatic grouping

### Automatic Product Matching

The scraping endpoint automatically:
1. **Normalizes product names** for consistent matching
2. **Uses similarity algorithms** (Jaro-Winkler) to find existing base products
3. **Creates new base products** if no sufficient match is found
4. **Associates store products** with their base products
5. **Updates counters** automatically via database triggers

### Price Update Frequency

- **Real-time**: Prices updated during scraping operations
- **Scheduled**: Regular price updates via automated scraping
- **Manual**: Admin-triggered price updates

## 🔗 Related Documentation

- [Product Comparison API](./PRODUCT_COMPARISON_API_ENDPOINTS.md) - Price comparison functionality
- [Scraping API](./SCRAPING_API_ENDPOINTS.md) - Automated price updates
- [Categories API](./CATEGORIES_API_ENDPOINTS.md) - Product categorization
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - JWT authentication setup
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - React/Next.js examples
- [Mobile Integration Guide](./MOBILE_INTEGRATION_GUIDE.md) - Flutter/React Native examples