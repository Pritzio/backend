# 🏪 Store Products API - Endpoints Documentation

*This document provides comprehensive documentation for the Store Products API endpoints. Store Products manage the main product catalog with a simplified structure for various integrations and implementations.*

*Last updated: 2025-01-27*
*API Version: 2.1*

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Store Product Management](#store-product-management)
  - [Scraping Integration](#scraping-integration)
  - [Categories Management](#categories-management)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Integration Examples](#integration-examples)

## 🎯 Overview

The Store Products API manages the main product catalog with a simplified structure designed for various integrations:

- **Simplified Structure**: Clean, minimal data model without complex relationships
- **Integration Ready**: Optimized for frontend applications, automation tools, and third-party integrations
- **Essential Fields Only**: Only necessary fields for product management and display
- **Automatic Defaults**: System sets default values for required fields
- **Flexible Metadata**: Support for custom data through metadata field

## 🔐 Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Required Roles

- **Public Endpoints**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`
- **Admin Endpoints**: `SUPER_ADMIN`, `ADMIN`

## 🌐 Base URL

```
http://localhost:3000/api/v1/store-products
```

## 🚀 Endpoints

### Store Product Management

#### Create Store Product

**POST** `/api/v1/store-products`

Creates a new store product with simplified structure.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**:
```json
{
  "name": "Habas Congeladas 500 g",
  "description": "Habas congeladas de alta calidad",
  "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
  "sku": "HABAS-500G-001",
  "storeProductId": "75413",
  "image": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
  "metadata": {
    "brand": "Cuisine & Co",
    "rating": 5,
    "ratingText": "5.0",
    "ppum": "$2.786 x kg$4.180 x kg$5.100 x kg$4.375 x kg$6.725 x kg$12.225 x kg$3.380 x kg$1.290 x kg$283 x un",
    "highResImageUrl": "https://jumbocl.vtexassets.com/arquivos/ids/363133-91-91/Habas-congeladas-500-g.jpg",
    "categories": ["Otras Verduras"],
    "scrapedAt": "2025-09-03T10:30:00.000Z",
    "source": "scraping"
  },
  "notes": "Scraped from Jumbo"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-store-product-id",
  "name": "Habas Congeladas 500 g",
  "description": "Habas congeladas de alta calidad",
  "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
  "sku": "HABAS-500G-001",
  "storeProductId": "75413",
  "image": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
  "metadata": {
    "brand": "Cuisine & Co",
    "rating": 5,
    "ratingText": "5.0",
    "ppum": "$2.786 x kg$4.180 x kg$5.100 x kg$4.375 x kg$6.725 x kg$12.225 x kg$3.380 x kg$1.290 x kg$283 x un",
    "highResImageUrl": "https://jumbocl.vtexassets.com/arquivos/ids/363133-91-91/Habas-congeladas-500-g.jpg",
    "categories": ["Otras Verduras"],
    "scrapedAt": "2025-09-03T10:30:00.000Z",
    "source": "scraping"
  },
  "lastScraped": "2025-09-03T10:30:00.000Z",
  "notes": "Scraped from Jumbo",
  "displayName": "Habas Congeladas 500 g",
  "createdBy": "uuid-user-id",
  "creatorId": "uuid-user-id",
  "creatorName": "John Doe",
  "createdAt": "2025-09-03T10:30:00.000Z",
  "updatedAt": "2025-09-03T10:30:00.000Z"
}
```

#### Get All Store Products

**GET** `/api/v1/store-products`

Retrieves store products with filtering and pagination.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search term for name or description
- `createdBy` (string) - Filter by creator ID
- `dateFrom` (date) - Filter by creation date (ISO string)
- `dateTo` (date) - Filter by creation date (ISO string)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid-store-product-id",
      "name": "Habas Congeladas 500 g",
      "description": "Habas congeladas de alta calidad",
      "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
      "sku": "HABAS-500G-001",
      "storeProductId": "75413",
      "image": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
      "metadata": {
        "brand": "Cuisine & Co",
        "rating": 5,
        "categories": ["Otras Verduras"]
      },
      "lastScraped": "2025-09-03T10:30:00.000Z",
      "notes": "Scraped from Jumbo",
      "displayName": "Habas Congeladas 500 g",
      "createdBy": "uuid-user-id",
      "creatorId": "uuid-user-id",
      "creatorName": "John Doe",
      "createdAt": "2025-09-03T10:30:00.000Z",
      "updatedAt": "2025-09-03T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Get Store Product by ID

**GET** `/api/v1/store-products/{id}`

Retrieves a specific store product by ID.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string) - Store product ID

**Response** (200 OK):
```json
{
  "id": "uuid-store-product-id",
  "name": "Habas Congeladas 500 g",
  "description": "Habas congeladas de alta calidad",
  "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
  "sku": "HABAS-500G-001",
  "storeProductId": "75413",
  "image": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
  "metadata": {
    "brand": "Cuisine & Co",
    "rating": 5,
    "ratingText": "5.0",
    "ppum": "$2.786 x kg$4.180 x kg$5.100 x kg$4.375 x kg$6.725 x kg$12.225 x kg$3.380 x kg$1.290 x kg$283 x un",
    "highResImageUrl": "https://jumbocl.vtexassets.com/arquivos/ids/363133-91-91/Habas-congeladas-500-g.jpg",
    "categories": ["Otras Verduras"],
    "scrapedAt": "2025-09-03T10:30:00.000Z",
    "source": "scraping"
  },
  "lastScraped": "2025-09-03T10:30:00.000Z",
  "notes": "Scraped from Jumbo",
  "displayName": "Habas Congeladas 500 g",
  "createdBy": "uuid-user-id",
  "creatorId": "uuid-user-id",
  "creatorName": "John Doe",
  "createdAt": "2025-09-03T10:30:00.000Z",
  "updatedAt": "2025-09-03T10:30:00.000Z"
}
```

#### Update Store Product

**PUT** `/api/v1/store-products/{id}`

Updates an existing store product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string) - Store product ID

**Request Body**: Same as create, but all fields optional

**Response** (200 OK): Updated store product object

#### Delete Store Product

**DELETE** `/api/v1/store-products/{id}`

Deletes a store product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string) - Store product ID

**Response** (200 OK):
```json
{
  "message": "Store product deleted successfully"
}
```

#### Get Admin Store Products

**GET** `/api/v1/store-products/admin`

Gets store products with admin-level information.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Response** (200 OK): Same as "Get All Store Products" but with admin access

### Scraping Integration

#### Add Scraped Products (Bulk)

**POST** `/api/v1/store-products/scraping/add-products`

Adds multiple products from scraping data with automatic duplicate detection.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**: Array of scraped product objects
```json
[
  {
    "id": "75413",
    "name": "Habas Congeladas 500 g",
    "description": "Habas congeladas de alta calidad",
    "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
    "sku": "HABAS-500G-001",
    "imageUrl": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
    "brand": "Cuisine & Co",
    "rating": 5,
    "ratingText": "5.0",
    "ppum": "$2.786 x kg",
    "highResImageUrl": "https://jumbocl.vtexassets.com/arquivos/ids/363133-91-91/Habas-congeladas-500-g.jpg",
    "categories": ["Otras Verduras"],
    "price": "$1,390"
  },
  {
    "id": "75414",
    "name": "Arroz Integral 1 kg",
    "description": "Arroz integral de grano largo",
    "url": "https://jumbo.cl/arroz-integral-1-kg-marca-propia-123456/p",
    "sku": "ARROZ-INT-1KG",
    "imageUrl": "https://jumbocl.vteximg.com.br/arquivos/ids/363134-250-250/Arroz-integral-1-kg.jpg",
    "brand": "Marca Propia",
    "rating": 4,
    "ratingText": "4.2",
    "ppum": "$1,200 x kg",
    "categories": ["Granos y Cereales"],
    "price": "$1,200"
  }
]
```

**Response** (201 Created):
```json
{
  "message": "Scraped products processed",
  "total": 2,
  "successful": 1,
  "failed": 1,
  "duplicates": 1,
  "errors": 0,
  "results": [
    {
      "success": true,
      "originalId": "75413",
      "createdProduct": {
        "id": "uuid-store-product-id",
        "name": "Habas Congeladas 500 g",
        "description": "Habas congeladas de alta calidad",
        "url": "https://jumbo.cl/habas-congeladas-500-g-cuisine-and-co-1763679/p",
        "sku": "HABAS-500G-001",
        "storeProductId": "75413",
        "image": "https://jumbocl.vteximg.com.br/arquivos/ids/363133-250-250/Habas-congeladas-500-g.jpg",
        "metadata": {
          "brand": "Cuisine & Co",
          "rating": 5,
          "ratingText": "5.0",
          "ppum": "$2.786 x kg",
          "highResImageUrl": "https://jumbocl.vtexassets.com/arquivos/ids/363133-91-91/Habas-congeladas-500-g.jpg",
          "categories": ["Otras Verduras"],
          "originalPrice": "$1,390",
          "originalData": { /* original scraped data */ }
        },
        "lastScraped": "2025-01-27T10:30:00.000Z",
        "notes": "Producto agregado desde scraping - 2025-01-27T10:30:00.000Z",
        "displayName": "Habas Congeladas 500 g",
        "createdBy": "uuid-user-id",
        "creatorId": "uuid-user-id",
        "creatorName": "John Doe",
        "createdAt": "2025-01-27T10:30:00.000Z",
        "updatedAt": "2025-01-27T10:30:00.000Z"
      }
    },
    {
      "success": false,
      "originalId": "75414",
      "error": "Product already exists",
      "errorDetails": {
        "reason": "duplicate",
        "existingProductId": "uuid-existing-product-id",
        "duplicateBy": "storeProductId",
        "duplicateValue": "75414"
      }
    }
  ],
  "logs": {
    "endpoint": "store-products/scraping/add-products",
    "timestamp": "2025-01-27T10:30:00.000Z",
    "user": "john.doe"
  }
}
```

**Duplicate Detection Logic**:
- Products are considered duplicates if they have the same `storeProductId` OR the same `url`
- Duplicate products are skipped and reported in the results
- The system provides detailed information about why a product was considered a duplicate

**Automatic Category Creation**:
- Categories are automatically created from the `categories` field in scraped data
- If a category doesn't exist, it's created with the name from the scraping data
- Products are automatically associated with their categories
- Original category data is preserved in `metadata.originalData.categories`

**Error Response** (400 Bad Request):
```json
{
  "error": "Data must be an array of products",
  "received": "object",
  "message": "Data is not an array: object",
  "logs": {
    "endpoint": "store-products/scraping/add-products",
    "timestamp": "2025-01-27T10:30:00.000Z",
    "user": "john.doe"
  }
}
```

### Categories Management

#### Get All Categories

**GET** `/api/v1/categories`

Retrieves all active categories.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Response** (200 OK):
```json
[
  {
    "id": "uuid-category-id",
    "name": "Electrónicos",
    "description": "Productos electrónicos y tecnología",
    "color": "#3B82F6",
    "icon": "laptop",
    "isActive": true,
    "productCount": 15,
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z",
    "displayName": "Electrónicos"
  }
]
```

#### Get Categories with Product Counts

**GET** `/api/v1/categories/with-counts`

Retrieves all active categories with their product counts.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Response** (200 OK): Same as "Get All Categories" but with accurate product counts

#### Get Category by ID

**GET** `/api/v1/categories/{id}`

Retrieves a specific category by ID.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string) - Category ID

**Response** (200 OK):
```json
{
  "id": "uuid-category-id",
  "name": "Electrónicos",
  "description": "Productos electrónicos y tecnología",
  "color": "#3B82F6",
  "icon": "laptop",
  "isActive": true,
  "productCount": 15,
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z",
  "displayName": "Electrónicos"
}
```

#### Create Category

**POST** `/api/v1/categories`

Creates a new category.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Request Body**:
```json
{
  "name": "Nueva Categoría",
  "description": "Descripción de la nueva categoría",
  "color": "#3B82F6",
  "icon": "laptop"
}
```

**Response** (201 Created): Created category object

#### Update Category

**PUT** `/api/v1/categories/{id}`

Updates an existing category.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string) - Category ID

**Request Body**: Same as create, but all fields optional

**Response** (200 OK): Updated category object

#### Delete Category

**DELETE** `/api/v1/categories/{id}`

Deletes a category (soft delete).

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string) - Category ID

**Response** (200 OK):
```json
{
  "message": "Category deleted successfully"
}
```

## 📊 Data Models

### CreateStoreProductDto
```typescript
interface CreateStoreProductDto {
  // Required fields
  name: string;                    // Product name (2-500 characters)
  
  // Optional fields
  description?: string;            // Product description (max 2000 characters)
  url?: string;                    // Product URL (max 500 characters, must be valid URL)
  sku?: string;                    // Store-specific SKU (max 100 characters)
  storeProductId?: string;         // Store-specific product ID (max 100 characters)
  image?: string;                  // Product image URL (max 500 characters, must be valid URL)
  metadata?: Record<string, any>;  // Additional metadata (JSON object)
  notes?: string;                  // Notes about the product (max 500 characters)
}
```

### IStoreProductResponse
```typescript
interface IStoreProductResponse {
  id: string;                      // UUID
  name: string;                    // Product name
  description?: string;            // Product description
  url?: string;                    // Product URL
  sku?: string;                    // Store-specific SKU
  storeProductId?: string;         // Store-specific product ID
  image?: string;                  // Product image URL
  metadata?: Record<string, any>;  // Additional metadata
  lastScraped?: Date;              // Last scraping timestamp
  notes?: string;                  // Notes about the product
  displayName: string;             // Display name (virtual property)
  createdBy: string;               // Creator user ID
  creatorId: string;               // Creator user ID (alias)
  creatorName: string;             // Creator full name
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  categories: ICategoryResponse[]; // Associated categories
}
```

### IStoreProductSummary
```typescript
interface IStoreProductSummary {
  id: string;                      // UUID
  name: string;                    // Product name
  description?: string;            // Product description
  url?: string;                    // Product URL
  sku?: string;                    // Store-specific SKU
  storeProductId?: string;         // Store-specific product ID
  image?: string;                  // Product image URL
  lastScraped?: Date;              // Last scraping timestamp
  createdAt: Date;                 // Creation timestamp
  creatorName: string;             // Creator full name
  categories: ICategoryResponse[]; // Associated categories
}
```

### IStoreProductFilter
```typescript
interface IStoreProductFilter {
  search?: string;                 // Search term for name or description
  createdBy?: string;              // Filter by creator ID
  dateFrom?: Date;                 // Filter by creation date (from)
  dateTo?: Date;                   // Filter by creation date (to)
}
```

### Category Interfaces

### ICategoryResponse
```typescript
interface ICategoryResponse {
  id: string;                      // UUID
  name: string;                    // Category name
  description?: string;            // Category description
  color?: string;                  // Color for UI (hexadecimal)
  icon?: string;                   // Icon name for UI
  isActive: boolean;               // Active status
  productCount: number;            // Number of associated products
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  displayName: string;             // Display name (virtual property)
}
```

### ICreateCategoryDto
```typescript
interface ICreateCategoryDto {
  name: string;                    // Category name (required)
  description?: string;            // Category description
  color?: string;                  // Color for UI (hexadecimal)
  icon?: string;                   // Icon name for UI
}
```

### IUpdateCategoryDto
```typescript
interface IUpdateCategoryDto {
  name?: string;                   // Category name
  description?: string;            // Category description
  color?: string;                  // Color for UI (hexadecimal)
  icon?: string;                   // Icon name for UI
  isActive?: boolean;              // Active status
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
- **Admin endpoints**: 50 requests per 15 minutes per IP

## 🔗 Integration Examples

### Frontend Integration (React/Next.js)

```typescript
// Fetch products for display
const fetchProducts = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/v1/store-products?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Create new product
const createProduct = async (productData) => {
  const response = await fetch('/api/v1/store-products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  return response.json();
};
```

### Automation Tools (n8n, Zapier, etc.)

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/v1/store-products",
  "headers": {
    "Authorization": "Bearer {{$json.accessToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{$json.productName}}",
    "description": "{{$json.description}}",
    "url": "{{$json.productUrl}}",
    "image": "{{$json.imageUrl}}",
    "metadata": {
      "brand": "{{$json.brand}}",
      "rating": "{{$json.rating}}",
      "categories": "{{$json.categories}}"
    }
  }
}
```

### Mobile App Integration

```dart
// Flutter/Dart example
class StoreProductService {
  static const String baseUrl = 'http://localhost:3000/api/v1/store-products';
  
  Future<List<StoreProduct>> getProducts({int page = 1, int limit = 20}) async {
    final response = await http.get(
      Uri.parse('$baseUrl?page=$page&limit=$limit'),
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
    throw Exception('Failed to load products');
  }
}
```

### Third-party API Integration

```python
# Python example
import requests

class StoreProductAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_product(self, product_data):
        response = requests.post(
            f'{self.base_url}/store-products',
            json=product_data,
            headers=self.headers
        )
        return response.json()
    
    def get_products(self, page=1, limit=20):
        response = requests.get(
            f'{self.base_url}/store-products',
            params={'page': page, 'limit': limit},
            headers=self.headers
        )
        return response.json()
    
    def add_scraped_products(self, products_array):
        """Add multiple products from scraping with duplicate detection"""
        response = requests.post(
            f'{self.base_url}/store-products/scraping/add-products',
            json=products_array,
            headers=self.headers
        )
        return response.json()
```

### Scraping Integration Example

```python
# Example of scraping integration with duplicate detection
def process_scraped_products(scraped_data, api_client):
    """
    Process scraped products with automatic duplicate detection
    """
    result = api_client.add_scraped_products(scraped_data)
    
    print(f"Total products processed: {result['total']}")
    print(f"Successfully created: {result['successful']}")
    print(f"Duplicates skipped: {result['duplicates']}")
    print(f"Errors: {result['errors']}")
    
    # Process individual results
    for item in result['results']:
        if item['success']:
            print(f"✅ Created product: {item['createdProduct']['name']}")
        elif item['errorDetails']['reason'] == 'duplicate':
            print(f"⚠️ Duplicate skipped: {item['originalId']} (duplicate by {item['errorDetails']['duplicateBy']})")
        else:
            print(f"❌ Error: {item['error']}")
    
    return result
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Pagination starts from page 1
- Maximum limit per page is 100 items
- **New in v2.0**: Simplified structure without complex relationships
- **New in v2.0**: Essential fields only for product management
- **New in v2.0**: Automatic default values for system fields
- **New in v2.0**: Flexible metadata field for custom data
- **New in v2.0**: Optimized for various integration scenarios
- **New in v2.1**: Duplicate validation for storeProductId and url
- **New in v2.1**: Bulk scraping endpoint with duplicate detection
- **New in v2.1**: Enhanced error reporting and statistics
- **New in v2.1**: Automatic category creation from scraping data
- **New in v2.1**: Product-category relationships with many-to-many mapping

### Duplicate Detection

The system automatically prevents duplicate products based on:
- **storeProductId**: Store-specific product identifier
- **url**: Product URL in the store

**Important Notes**:
- Duplicate detection is performed during bulk scraping operations
- Products with the same `storeProductId` OR `url` are considered duplicates
- Duplicate products are skipped and reported in the response
- The system provides detailed information about why a product was considered a duplicate
- Both `storeProductId` and `url` can be `null` - multiple products can have `null` values
- Unique indexes are enforced at the database level for non-null values

### Category Management

The system automatically manages categories from scraping data:

- **Automatic Creation**: Categories are created automatically from `product.categories` array
- **Many-to-Many Relationships**: Products can belong to multiple categories
- **Original Data Preservation**: Scraping category data is preserved in `metadata.originalData.categories`
- **UI Support**: Categories include color and icon fields for frontend display
- **Product Counting**: Automatic tracking of products per category

## 🔗 Related Documentation

- [Categories API](./CATEGORIES_API_ENDPOINTS.md) - Category management endpoints
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - JWT authentication setup
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - React/Next.js examples
- [Mobile Integration Guide](./MOBILE_INTEGRATION_GUIDE.md) - Flutter/React Native examples
- [API Integration Guide](./API_INTEGRATION_GUIDE.md) - Third-party integration examples
