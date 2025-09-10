# 🔍 Product Comparison API - Endpoints Documentation

*This document provides comprehensive API documentation for the Product Comparison module, including all endpoints, request/response formats, and practical examples for price comparison functionality.*

*Last updated: 2025-01-27*
*API Version: 1.0*

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

The Product Comparison API enables automatic product matching and price comparison across multiple stores. Key features:

- **Automatic Product Matching**: Uses similarity algorithms to group identical products
- **Price Comparison**: Compare prices across different stores for the same product
- **Search Functionality**: Find products by name, brand, or description
- **Real-time Data**: Live price updates from scraping operations
- **Store Analytics**: Track which stores carry specific products

## 🔐 Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Required Roles

- **Read Endpoints**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`
- **Write Endpoints**: `SUPER_ADMIN`, `ADMIN`

## 🌐 Base URL

```
http://localhost:3000/api/v1/product-comparison
```

## 🚀 Endpoints

### Search Products

**GET** `/api/v1/product-comparison/search`

Searches for products that can be compared across stores.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `q` (string, required): Search query (minimum 2 characters)

**Example Request**:
```bash
GET /api/v1/product-comparison/search?q=nova%20papel%2070m
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid-base-product-id",
      "name": "nova papel 70m",
      "brand": "nova",
      "model": "70m",
      "fullName": "nova nova papel 70m 70m",
      "storeCount": 3,
      "totalVariants": 5,
      "image": "https://example.com/nova-papel-70m.jpg",
      "createdAt": "2025-01-27T10:30:00.000Z"
    },
    {
      "id": "uuid-base-product-id-2",
      "name": "nova papel 70 metros",
      "brand": "nova",
      "model": "70 metros",
      "fullName": "nova nova papel 70 metros 70 metros",
      "storeCount": 2,
      "totalVariants": 3,
      "image": "https://example.com/nova-papel-70-metros.jpg",
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "total": 2,
  "query": "nova papel 70m"
}
```

**Error Response** (400 Bad Request):
```json
{
  "data": [],
  "message": "Query must be at least 2 characters",
  "total": 0,
  "query": "n"
}
```

### Get Product Comparison

**GET** `/api/v1/product-comparison/{id}`

Retrieves detailed price comparison for a specific base product across all stores.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string): Base product ID

**Example Request**:
```bash
GET /api/v1/product-comparison/uuid-base-product-id
```

**Response** (200 OK):
```json
{
  "product": {
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
    "avg": 1850
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
      "price": 1500
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
      "price": 1800
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
      "price": 2200
    }
  ],
  "totalStores": 3,
  "lastUpdated": "2025-01-27T10:30:00.000Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Base product not found",
  "error": "Not Found"
}
```

## 📊 Data Models

### IProductSearchResult
```typescript
interface IProductSearchResult {
  id: string;                      // Base product ID
  name: string;                    // Normalized product name
  brand?: string;                  // Product brand
  model?: string;                  // Product model
  fullName: string;                // Combined name (brand + name + model)
  storeCount: number;              // Number of stores carrying this product
  totalVariants: number;           // Total product variants
  image?: string;                  // Representative product image
  createdAt: string;               // Creation timestamp
}
```

### IProductComparison
```typescript
interface IProductComparison {
  product: {
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
  "data": [],
  "message": "Query must be at least 2 characters",
  "total": 0,
  "query": "n"
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
  "message": "Base product not found",
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

- **Search endpoints**: 100 requests per 15 minutes per IP
- **Comparison endpoints**: 50 requests per 15 minutes per IP

## 🔗 Integration Examples

### Frontend Integration (React/Next.js)

```typescript
// Search products for comparison
const searchProducts = async (query: string) => {
  const response = await fetch(`/api/v1/product-comparison/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get detailed price comparison
const getProductComparison = async (baseProductId: string) => {
  const response = await fetch(`/api/v1/product-comparison/${baseProductId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

const useProductComparison = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProducts = async (query: string) => {
    if (query.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/product-comparison/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getComparison = async (baseProductId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/product-comparison/${baseProductId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchResults,
    comparison,
    loading,
    error,
    searchProducts,
    getComparison
  };
};
```

### Vue.js Example
```javascript
// Vue 3 Composition API
import { ref } from 'vue';

export function useProductComparison() {
  const searchResults = ref([]);
  const comparison = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const searchProducts = async (query) => {
    if (query.length < 2) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`/api/v1/product-comparison/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      searchResults.value = data.data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getComparison = async (baseProductId) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`/api/v1/product-comparison/${baseProductId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      comparison.value = data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    searchResults,
    comparison,
    loading,
    error,
    searchProducts,
    getComparison
  };
}
```

### Mobile App Integration

```dart
// Flutter/Dart example
class ProductComparisonService {
  static const String baseUrl = 'http://localhost:3000/api/v1/product-comparison';
  
  Future<List<ProductSearchResult>> searchProducts(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/search?q=${Uri.encodeComponent(query)}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => ProductSearchResult.fromJson(json))
          .toList();
    }
    throw Exception('Failed to search products');
  }
  
  Future<ProductComparison> getProductComparison(String baseProductId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$baseProductId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return ProductComparison.fromJson(data);
    }
    throw Exception('Failed to get product comparison');
  }
}
```

### Third-party API Integration

```python
# Python example
import requests

class ProductComparisonAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def search_products(self, query):
        response = requests.get(
            f'{self.base_url}/search',
            params={'q': query},
            headers=self.headers
        )
        return response.json()
    
    def get_product_comparison(self, base_product_id):
        response = requests.get(
            f'{self.base_url}/{base_product_id}',
            headers=self.headers
        )
        return response.json()
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Search queries are case-insensitive
- Minimum search query length is 2 characters
- Price comparisons are sorted by price (ascending)
- Store verification status affects display priority

### Automatic Product Matching

Products are automatically matched using:
1. **Text Normalization**: Removes special characters, normalizes spaces
2. **Similarity Algorithm**: Jaro-Winkler algorithm for name and brand matching
3. **Threshold**: 80% similarity required for automatic matching
4. **Batch Processing**: Efficient processing of multiple products

### Price Update Frequency

- **Real-time**: Prices updated during scraping operations
- **Scheduled**: Regular price updates via automated scraping
- **Manual**: Admin-triggered price updates

## 🔗 Related Documentation

- [Store Products API](./STORE_PRODUCTS_API_ENDPOINTS.md) - Store product management
- [Scraping API](./SCRAPING_API_ENDPOINTS.md) - Automated price updates
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - JWT authentication setup
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - React/Next.js examples
- [Mobile Integration Guide](./MOBILE_INTEGRATION_GUIDE.md) - Flutter/React Native examples

