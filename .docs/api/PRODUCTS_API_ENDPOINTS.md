# 🛍️ Products API - Endpoints Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Products module, including all endpoints, request/response formats, and practical examples for frontend implementation.

## 🔐 Authentication

All endpoints require authentication using JWT Bearer tokens:

```bash
Authorization: Bearer <your-jwt-token>
```

## 🏷️ Base URL

```
http://localhost:3000/api/v1/products
```

## 📊 Response Format

All responses follow this standard format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Endpoints

### 1. **Create Single Product**

**Endpoint**: `POST /api/v1/products`

**Description**: Create a new product in the system.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**:
```json
{
  "name": "iPhone 15 Pro",
  "code": "IPHONE15PRO-256GB",
  "description": "Latest iPhone with advanced features",
  "category": "Electronics",
  "subcategory": "Smartphones",
  "brand": "Apple",
  "type": "physical",
  "status": "active",
  "condition": "new",
  "model": "A3102",
  "manufacturer": "Apple Inc.",
  "country": "United States",
  "weight": 187.0,
  "weightUnit": "g",
  "length": 14.7,
  "width": 7.1,
  "height": 0.8,
  "dimensionUnit": "cm",
  "warrantyMonths": 12,
  "specifications": {
    "color": "Space Black",
    "storage": "256GB",
    "ram": "8GB"
  },
  "features": ["5G", "Face ID", "Pro Camera System"],
  "tags": ["smartphone", "5G", "camera", "premium"],
  "metadata": {
    "scrapingPriority": "high",
    "scrapingSource": "apple.com"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "iPhone 15 Pro",
    "code": "IPHONE15PRO-256GB",
    "description": "Latest iPhone with advanced features",
    "category": "Electronics",
    "subcategory": "Smartphones",
    "brand": "Apple",
    "type": "physical",
    "status": "active",
    "condition": "new",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": "user-uuid",
      "username": "admin"
    }
  },
  "message": "Product created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. **Bulk Create Products** ⭐ NEW

**Endpoint**: `POST /api/v1/products/bulk/create`

**Description**: Create multiple products in a single request. Ideal for automated scraping and bulk imports.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**:
```json
{
  "products": [
    {
      "name": "iPhone 15 Pro",
      "code": "IPHONE15PRO-256GB",
      "category": "Electronics",
      "subcategory": "Smartphones",
      "brand": "Apple",
      "type": "physical",
      "status": "active",
      "condition": "new",
      "description": "Latest iPhone with advanced features",
      "specifications": {
        "color": "Space Black",
        "storage": "256GB"
      },
      "features": ["5G", "Face ID"],
      "tags": ["smartphone", "5G", "premium"]
    },
    {
      "name": "Samsung Galaxy S24",
      "code": "SAMSUNG-S24-256GB",
      "category": "Electronics",
      "subcategory": "Smartphones",
      "brand": "Samsung",
      "type": "physical",
      "status": "active",
      "condition": "new",
      "description": "Latest Samsung flagship smartphone",
      "specifications": {
        "color": "Titanium Gray",
        "storage": "256GB"
      },
      "features": ["5G", "S Pen"],
      "tags": ["smartphone", "5G", "android"]
    }
  ],
  "options": {
    "skipDuplicates": true,
    "validateOnly": false
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "total": 2,
    "results": [
      {
        "success": true,
        "product": {
          "id": "uuid-1",
          "name": "iPhone 15 Pro",
          "code": "IPHONE15PRO-256GB"
        },
        "error": null,
        "index": 0
      },
      {
        "success": true,
        "product": {
          "id": "uuid-2",
          "name": "Samsung Galaxy S24",
          "code": "SAMSUNG-S24-256GB"
        },
        "error": null,
        "index": 1
      }
    ]
  },
  "message": "Bulk operation completed: 2 created, 0 failed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. **Get All Products**

**Endpoint**: `GET /api/v1/products`

**Description**: Retrieve all products with filtering and pagination.

**Permissions**: All authenticated users

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `search` (string): Search term for name, description, or code
- `category` (string): Filter by category
- `subcategory` (string): Filter by subcategory
- `brand` (string): Filter by brand
- `type` (enum): Filter by product type (`physical`, `digital`, `service`, `subscription`)
- `status` (enum): Filter by status (`active`, `inactive`, `discontinued`, `out_of_stock`, `coming_soon`)
- `condition` (enum): Filter by condition (`new`, `used`, `refurbished`, `open_box`)
- `hasWarranty` (boolean): Filter by warranty availability
- `hasDimensions` (boolean): Filter by dimensions availability
- `hasWeight` (boolean): Filter by weight availability
- `minWeight` (number): Minimum weight filter
- `maxWeight` (number): Maximum weight filter
- `minWarranty` (number): Minimum warranty months
- `maxWarranty` (number): Maximum warranty months
- `tags` (string): Comma-separated tags to filter by
- `features` (string): Comma-separated features to filter by
- `createdBy` (string): Filter by creator ID
- `createdAfter` (ISO string): Filter by creation date
- `createdBefore` (ISO string): Filter by creation date

**Example Request**:
```bash
GET /api/v1/products?page=1&limit=20&category=Electronics&status=active&search=iPhone
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid-here",
        "name": "iPhone 15 Pro",
        "code": "IPHONE15PRO-256GB",
        "category": "Electronics",
        "subcategory": "Smartphones",
        "brand": "Apple",
        "type": "physical",
        "status": "active",
        "condition": "new",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "creator": {
          "id": "user-uuid",
          "username": "admin"
        }
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Products retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. **Get Product by ID**

**Endpoint**: `GET /api/v1/products/{id}`

**Description**: Retrieve a specific product by its ID.

**Permissions**: All authenticated users

**Path Parameters**:
- `id` (string): Product UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "iPhone 15 Pro",
    "code": "IPHONE15PRO-256GB",
    "description": "Latest iPhone with advanced features",
    "category": "Electronics",
    "subcategory": "Smartphones",
    "brand": "Apple",
    "type": "physical",
    "status": "active",
    "condition": "new",
    "model": "A3102",
    "manufacturer": "Apple Inc.",
    "country": "United States",
    "weight": 187.0,
    "weightUnit": "g",
    "length": 14.7,
    "width": 7.1,
    "height": 0.8,
    "dimensionUnit": "cm",
    "warrantyMonths": 12,
    "specifications": {
      "color": "Space Black",
      "storage": "256GB",
      "ram": "8GB"
    },
    "features": ["5G", "Face ID", "Pro Camera System"],
    "tags": ["smartphone", "5G", "camera", "premium"],
    "metadata": {
      "scrapingPriority": "high",
      "scrapingSource": "apple.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": "user-uuid",
      "username": "admin"
    }
  },
  "message": "Product retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. **Get Product by Code**

**Endpoint**: `GET /api/v1/products/code/{code}`

**Description**: Retrieve a specific product by its code.

**Permissions**: All authenticated users

**Path Parameters**:
- `code` (string): Product code

**Example Request**:
```bash
GET /api/v1/products/code/IPHONE15PRO-256GB
```

**Response**: Same as Get Product by ID

### 6. **Update Product**

**Endpoint**: `PUT /api/v1/products/{id}`

**Description**: Update an existing product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string): Product UUID

**Request Body**: Same structure as Create Product (all fields optional)

**Response** (200 OK): Same as Get Product by ID

### 7. **Delete Product**

**Endpoint**: `DELETE /api/v1/products/{id}`

**Description**: Delete a product from the system.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string): Product UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8. **Change Product Status**

**Endpoint**: `PUT /api/v1/products/{id}/status`

**Description**: Change the status of a product.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Path Parameters**:
- `id` (string): Product UUID

**Request Body**:
```json
{
  "status": "inactive"
}
```

**Response** (200 OK): Same as Get Product by ID

### 9. **Get Products for Scraping** ⭐ NEW

**Endpoint**: `GET /api/v1/products/scraping/ready`

**Description**: Get products that need price updates or are suitable for scraping operations.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `limit` (number, default: 50): Maximum products to return
- `priority` (enum): Filter by scraping priority (`high`, `medium`, `low`, `all`)
- `category` (string): Filter by product category
- `lastScrapedBefore` (ISO string): Get products not scraped since this date

**Example Request**:
```bash
GET /api/v1/products/scraping/ready?limit=20&priority=high&category=Electronics
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "iPhone 15 Pro",
      "code": "IPHONE15PRO-256GB",
      "brand": "Apple",
      "category": "Electronics",
      "subcategory": "Smartphones",
      "lastScraped": "2024-01-10T10:30:00.000Z",
      "scrapingPriority": "high",
      "scrapingMetadata": {},
      "scrapingSource": "amazon",
      "scrapingStatus": "pending"
    }
  ],
  "message": "Found 25 products ready for scraping",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 10. **Update Scraping Metadata** ⭐ NEW

**Endpoint**: `POST /api/v1/products/scraping/update`

**Description**: Update scraping information and metadata for products after scraping operations.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Request Body**:
```json
{
  "productId": "uuid-here",
  "scrapingData": {
    "lastScraped": "2024-01-15T10:30:00.000Z",
    "scrapingSource": "amazon",
    "scrapingStatus": "completed",
    "scrapingMetadata": {
      "price": 999.99,
      "availability": "in_stock",
      "rating": 4.5,
      "reviews": 1250
    },
    "scrapingErrors": []
  }
}
```

**Response** (200 OK): Same as Get Product by ID

### 11. **Bulk Operations**

#### **Bulk Activate Products**
**Endpoint**: `POST /api/v1/products/bulk/activate`

**Request Body**:
```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Deactivate Products**
**Endpoint**: `POST /api/v1/products/bulk/deactivate`

**Request Body**:
```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Discontinue Products**
**Endpoint**: `POST /api/v1/products/bulk/discontinue`

**Request Body**:
```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Delete Products**
**Endpoint**: `POST /api/v1/products/bulk/delete`

**Request Body**:
```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### **Bulk Update Products**
**Endpoint**: `POST /api/v1/products/bulk/update`

**Request Body**:
```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"],
  "data": {
    "status": "active",
    "category": "Electronics"
  }
}
```

**Response for Bulk Operations**:
```json
{
  "success": true,
  "data": {
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
  },
  "message": "Bulk operation completed: 3 updated, 0 failed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 12. **Get Product Analytics**

**Endpoint**: `GET /api/v1/products/analytics`

**Description**: Get product analytics and statistics.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalProducts": 1250,
    "activeProducts": 1100,
    "inactiveProducts": 100,
    "discontinuedProducts": 50,
    "productsByType": {
      "physical": 1000,
      "digital": 200,
      "service": 30,
      "subscription": 20
    },
    "productsByCategory": {
      "Electronics": 500,
      "Clothing": 300,
      "Home & Garden": 200,
      "Sports": 150,
      "Other": 100
    },
    "productsByStatus": {
      "active": 1100,
      "inactive": 100,
      "discontinued": 50
    },
    "recentActivity": {
      "createdToday": 15,
      "createdThisWeek": 85,
      "createdThisMonth": 320,
      "createdThisYear": 1250
    }
  },
  "message": "Analytics retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be at least 2 characters long"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 'uuid-here' not found"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **409 Conflict**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_PRODUCT",
    "message": "Product with code 'IPHONE15PRO-256GB' already exists"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📝 Data Types

### **Product Types**
- `physical`: Physical products
- `digital`: Digital products
- `service`: Services
- `subscription`: Subscription-based products

### **Product Status**
- `active`: Product is active and available
- `inactive`: Product is temporarily inactive
- `discontinued`: Product is discontinued
- `out_of_stock`: Product is out of stock
- `coming_soon`: Product is coming soon

### **Product Condition**
- `new`: Brand new product
- `used`: Used product
- `refurbished`: Refurbished product
- `open_box`: Open box product

## 🚀 Frontend Implementation Examples

### **JavaScript/TypeScript Examples**

#### **Create Product**
```javascript
const createProduct = async (productData) => {
  const response = await fetch('/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  
  return await response.json();
};
```

#### **Bulk Create Products**
```javascript
const bulkCreateProducts = async (products, options = {}) => {
  const response = await fetch('/api/v1/products/bulk/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      products,
      options: {
        skipDuplicates: true,
        validateOnly: false,
        ...options
      }
    })
  });
  
  return await response.json();
};
```

#### **Get Products with Filters**
```javascript
const getProducts = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/products?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usage
const products = await getProducts({
  page: 1,
  limit: 20,
  category: 'Electronics',
  status: 'active',
  search: 'iPhone'
});
```

#### **Get Products for Scraping**
```javascript
const getProductsForScraping = async (options = {}) => {
  const queryParams = new URLSearchParams(options);
  const response = await fetch(`/api/v1/products/scraping/ready?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

#### **Update Scraping Metadata**
```javascript
const updateScrapingMetadata = async (productId, scrapingData) => {
  const response = await fetch('/api/v1/products/scraping/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      scrapingData
    })
  });
  
  return await response.json();
};
```

### **React Hook Example**
```javascript
import { useState, useEffect } from 'react';

const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/v1/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(filters)]);

  return { products, loading, error, refetch: fetchProducts };
};
```

## 🔧 Testing

### **Postman Collection**
You can import this collection into Postman for testing:

```json
{
  "info": {
    "name": "Products API",
    "description": "Complete Products API collection"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1/products"
    }
  ]
}
```

### **cURL Examples**

#### **Create Product**
```bash
curl -X POST "http://localhost:3000/api/v1/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "code": "IPHONE15PRO-256GB",
    "category": "Electronics",
    "type": "physical",
    "status": "active",
    "condition": "new"
  }'
```

#### **Bulk Create**
```bash
curl -X POST "http://localhost:3000/api/v1/products/bulk/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Product 1",
        "code": "PROD-001",
        "category": "Electronics",
        "type": "physical",
        "status": "active",
        "condition": "new"
      }
    ],
    "options": {
      "skipDuplicates": true
    }
  }'
```

## 📚 Additional Resources

- **Swagger Documentation**: Available at `http://localhost:3000/api/docs` when running the application
- **Technical Documentation**: See `.dev/technical/PRODUCTS_MODULE_ENHANCEMENTS.md`
- **Architecture Overview**: See `.dev/architecture/overview.md`

## 🆘 Support

For technical support or questions about the API:
- Check the Swagger documentation
- Review the technical documentation
- Contact the backend development team

---

*Last updated: 2024-01-15*
*API Version: 1.0*

