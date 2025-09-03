# 🏷️ Categories API - Endpoints Documentation

*This document provides comprehensive documentation for the Categories API endpoints. Categories manage product classification with automatic creation from scraping data and many-to-many relationships with products.*

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

The Categories API manages product classification with the following features:

- **Automatic Creation**: Categories are created automatically from scraping data
- **Many-to-Many Relationships**: Products can belong to multiple categories
- **UI Support**: Color and icon fields for frontend display
- **Soft Delete**: Categories are marked as inactive instead of being deleted
- **Product Counting**: Automatic tracking of products per category
- **Original Data Preservation**: Scraping category data is preserved in product metadata

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
http://localhost:3000/api/v1/categories
```

## 🚀 Endpoints

### Get All Categories

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
  },
  {
    "id": "uuid-category-id-2",
    "name": "Hogar y Jardín",
    "description": "Artículos para el hogar y jardín",
    "color": "#10B981",
    "icon": "home",
    "isActive": true,
    "productCount": 8,
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z",
    "displayName": "Hogar y Jardín"
  }
]
```

### Get Categories with Product Counts

**GET** `/api/v1/categories/with-counts`

Retrieves all active categories with accurate product counts.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Response** (200 OK): Same as "Get All Categories" but with real-time product counts

### Get Category by ID

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

**Error Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Category with ID 'uuid' not found",
  "error": "Not Found"
}
```

### Create Category

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

**Response** (201 Created):
```json
{
  "id": "uuid-category-id",
  "name": "Nueva Categoría",
  "description": "Descripción de la nueva categoría",
  "color": "#3B82F6",
  "icon": "laptop",
  "isActive": true,
  "productCount": 0,
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z",
  "displayName": "Nueva Categoría"
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Category name already exists",
  "error": "Bad Request"
}
```

### Update Category

**PUT** `/api/v1/categories/{id}`

Updates an existing category.

**Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:
- `id` (string) - Category ID

**Request Body**: Same as create, but all fields optional
```json
{
  "name": "Categoría Actualizada",
  "description": "Nueva descripción",
  "color": "#EF4444",
  "icon": "heart"
}
```

**Response** (200 OK): Updated category object

### Delete Category

**DELETE** `/api/v1/categories/{id}`

Deletes a category (soft delete - marks as inactive).

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
  "message": "Category with ID 'uuid' not found",
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
// Fetch categories for display
const fetchCategories = async () => {
  const response = await fetch('/api/v1/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Create new category
const createCategory = async (categoryData) => {
  const response = await fetch('/api/v1/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  return response.json();
};
```

### Mobile App Integration

```dart
// Flutter/Dart example
class CategoryService {
  static const String baseUrl = 'http://localhost:3000/api/v1/categories';
  
  Future<List<Category>> getCategories() async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data as List)
          .map((json) => Category.fromJson(json))
          .toList();
    }
    throw Exception('Failed to load categories');
  }
}
```

### Third-party API Integration

```python
# Python example
import requests

class CategoryAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_categories(self):
        response = requests.get(
            f'{self.base_url}/categories',
            headers=self.headers
        )
        return response.json()
    
    def create_category(self, category_data):
        response = requests.post(
            f'{self.base_url}/categories',
            json=category_data,
            headers=self.headers
        )
        return response.json()
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Category names must be unique
- Categories are created automatically from scraping data
- Soft delete preserves data integrity
- Product counts are updated automatically
- Color and icon fields support UI customization

### Automatic Category Creation

Categories are automatically created when products are added via scraping:

1. **Extraction**: Categories are extracted from `product.categories` array
2. **Validation**: System checks if categories already exist
3. **Creation**: New categories are created with default values
4. **Association**: Products are linked to their categories
5. **Preservation**: Original category data is saved in product metadata

### Predefined Categories

The system includes predefined categories:
- Electrónicos, Hogar y Jardín, Ropa y Accesorios
- Deportes y Fitness, Libros y Medios, Salud y Belleza
- Automotriz, Juguetes y Juegos, Alimentación, Oficina y Escuela

## 🔗 Related Documentation

- [Store Products API](./STORE_PRODUCTS_API_ENDPOINTS.md) - Product management with categories
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - JWT authentication setup
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - React/Next.js examples
- [Mobile Integration Guide](./MOBILE_INTEGRATION_GUIDE.md) - Flutter/React Native examples
