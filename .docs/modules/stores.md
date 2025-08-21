# 🏪 Stores Module - User Guide

## 📋 Overview

The Stores Module allows you to manage retail stores, physical locations, and store analytics on the Pritzio platform. This module supports both online and physical stores with comprehensive management capabilities.

## 🚀 Quick Start

### Prerequisites
- **Authentication**: Valid JWT token required for all endpoints
- **Permissions**: Role-based access control (see permissions section)
- **Database**: Stores and locations will be created automatically

### Basic Usage
1. **Create a Store**: Use `POST /stores` to create a new store
2. **Add Locations**: Use `POST /stores/:storeId/locations` to add physical locations
3. **View Analytics**: Use `GET /stores/:id/analytics` to see store performance

## 🔐 Permissions & Access

### Role Requirements

| Endpoint | SUPER_ADMIN | ADMIN | STORE_ADMIN | Regular User |
|-----------|-------------|-------|-------------|--------------|
| Create Store | ✅ | ✅ | ❌ | ❌ |
| View All Stores | ✅ | ✅ | Limited | ❌ |
| Update Store | ✅ | ✅ | Own Only | ❌ |
| Delete Store | ✅ | ❌ | ❌ | ❌ |
| Manage Locations | ✅ | ✅ | Own Only | ❌ |
| View Analytics | ✅ | ✅ | Own Only | ❌ |

### Permission Details

#### SUPER_ADMIN
- Full access to all stores and operations
- Can delete any store
- Can verify/suspend any store
- Access to admin analytics

#### ADMIN
- Can create, view, and update any store
- Cannot delete stores
- Can verify/suspend stores
- Access to admin analytics

#### STORE_ADMIN
- Can only manage stores they created
- Can add/update/delete locations for their stores
- Access to store-specific analytics
- Cannot create new stores

#### Regular Users
- No access to store management
- Read-only access to public store information

## 🏪 Store Management

### Creating a Store

**Endpoint**: `POST /stores`

**Required Fields**:
- `name`: Store name (must be unique)
- `website`: Store website URL (must be unique)
- `type`: Store type (online, physical, hybrid)
- `category`: Store category (electronics, clothing, etc.)

**Optional Fields**:
- `description`: Store description
- `logo`: Logo URL
- `phone`: Contact phone number
- `email`: Contact email
- `country`: Store country
- `timezone`: Store timezone
- `metadata`: Additional information

**Example Request**:
```json
{
  "name": "Tech Store Plus",
  "description": "Premium electronics and gadgets",
  "website": "https://techstoreplus.com",
  "logo": "https://techstoreplus.com/logo.png",
  "type": "hybrid",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@techstoreplus.com",
  "country": "United States",
  "timezone": "America/New_York",
  "metadata": {
    "socialMedia": {
      "instagram": "techstoreplus"
    },
    "features": ["price_match", "extended_warranty"]
  }
}
```

**Response**:
```json
{
  "id": "uuid-store-id",
  "name": "Tech Store Plus",
  "description": "Premium electronics and gadgets",
  "website": "https://techstoreplus.com",
  "logo": "https://techstoreplus.com/logo.png",
  "type": "hybrid",
  "status": "pending_verification",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@techstoreplus.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": false,
  "createdAt": "2025-01-21T10:00:00.000Z",
  "updatedAt": "2025-01-21T10:00:00.000Z"
}
```

### Viewing Stores

#### Get All Stores
**Endpoint**: `GET /stores`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by store type
- `status`: Filter by store status
- `category`: Filter by store category
- `country`: Filter by country
- `isVerified`: Filter by verification status
- `hasPhysicalLocations`: Filter by physical locations
- `search`: Search in name, description, or website
- `createdAfter`: Filter by creation date (after)
- `createdBefore`: Filter by creation date (before)

**Example Request**:
```
GET /stores?page=1&limit=10&type=hybrid&category=electronics&isVerified=true
```

**Response**:
```json
{
  "stores": [
    {
      "id": "uuid-store-id",
      "name": "Tech Store Plus",
      "website": "https://techstoreplus.com",
      "logo": "https://techstoreplus.com/logo.png",
      "type": "hybrid",
      "status": "active",
      "category": "electronics",
      "country": "United States",
      "isVerified": true,
      "storeProductsCount": 0,
      "physicalLocationsCount": 0,
      "createdAt": "2025-01-21T10:00:00.000Z",
      "updatedAt": "2025-01-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "type": "hybrid",
    "category": "electronics",
    "isVerified": true
  }
}
```

#### Get Store by ID
**Endpoint**: `GET /stores/:id`

**Response**:
```json
{
  "id": "uuid-store-id",
  "name": "Tech Store Plus",
  "description": "Premium electronics and gadgets",
  "website": "https://techstoreplus.com",
  "logo": "https://techstoreplus.com/logo.png",
  "type": "hybrid",
  "status": "active",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@techstoreplus.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": true,
  "verifiedAt": "2025-01-21T11:00:00.000Z",
  "verifiedBy": "admin-user-id",
  "metadata": {
    "socialMedia": {
      "instagram": "techstoreplus"
    },
    "features": ["price_match", "extended_warranty"]
  },
  "createdBy": "admin-user-id",
  "createdAt": "2025-01-21T10:00:00.000Z",
  "updatedAt": "2025-01-21T11:00:00.000Z",
  "creator": {
    "id": "admin-user-id",
    "username": "admin",
    "email": "admin@pritzio.com",
    "roles": [
      {
        "id": "role-id",
        "name": "ADMIN",
        "displayName": "Administrator"
      }
    ]
  },
  "storeProductsCount": 0,
  "physicalLocationsCount": 0,
  "verificationStatus": "verified"
}
```

### Updating a Store

**Endpoint**: `PUT /stores/:id`

**Request Body**: Same as Create Store (all fields optional)

**Example Request**:
```json
{
  "description": "Updated description for Tech Store Plus",
  "phone": "+1-555-987-6543",
  "metadata": {
    "socialMedia": {
      "instagram": "techstoreplus",
      "facebook": "techstoreplus"
    },
    "features": ["price_match", "extended_warranty", "free_shipping"]
  }
}
```

### Deleting a Store

**Endpoint**: `DELETE /stores/:id`

**Note**: Only SUPER_ADMIN can delete stores. Store must not have associated products or locations.

**Response**:
```json
{
  "message": "Store deleted successfully",
  "storeId": "uuid-store-id"
}
```

## 📍 Physical Location Management

### Adding a Physical Location

**Endpoint**: `POST /stores/:storeId/locations`

**Required Fields**:
- `address`: Street address
- `city`: City name
- `state`: State or province
- `zipCode`: ZIP or postal code
- `country`: Country name
- `latitude`: Latitude coordinate (-90 to 90)
- `longitude`: Longitude coordinate (-180 to 180)

**Optional Fields**:
- `phone`: Location phone number
- `hours`: Business hours
- `physicalPrice`: Product-specific pricing
- `currency`: Currency for pricing (default: USD)
- `notes`: Additional notes
- `metadata`: Additional information

**Example Request**:
```json
{
  "address": "123 Tech Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-123-4567",
  "hours": "Mon-Fri: 9AM-9PM, Sat: 10AM-8PM, Sun: 11AM-6PM",
  "notes": "Flagship store in Manhattan",
  "metadata": {
    "parking": "Street parking available",
    "accessibility": "Wheelchair accessible",
    "services": ["repair_center", "demo_station"]
  }
}
```

**Response**:
```json
{
  "id": "uuid-location-id",
  "storeId": "uuid-store-id",
  "address": "123 Tech Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-123-4567",
  "hours": "Mon-Fri: 9AM-9PM, Sat: 10AM-8PM, Sun: 11AM-6PM",
  "physicalPrice": null,
  "currency": "USD",
  "status": "active",
  "notes": "Flagship store in Manhattan",
  "metadata": {
    "parking": "Street parking available",
    "accessibility": "Wheelchair accessible",
    "services": ["repair_center", "demo_station"]
  },
  "createdAt": "2025-01-21T12:00:00.000Z",
  "updatedAt": "2025-01-21T12:00:00.000Z"
}
```

### Updating a Physical Location

**Endpoint**: `PUT /stores/locations/:locationId`

**Request Body**: Same as Create Location (all fields optional)

### Deleting a Physical Location

**Endpoint**: `DELETE /stores/locations/:locationId`

**Response**:
```json
{
  "message": "Physical location deleted successfully",
  "locationId": "uuid-location-id"
}
```

## 📊 Store Analytics

### Getting Store Analytics

**Endpoint**: `GET /stores/:id/analytics`

**Response**:
```json
{
  "id": "uuid-store-id",
  "name": "Tech Store Plus",
  "totalProducts": 25,
  "activeProducts": 23,
  "totalLocations": 3,
  "activeLocations": 3,
  "averageOnlinePrice": 299.99,
  "averagePhysicalPrice": 315.50,
  "priceComparison": {
    "onlineOnly": 5,
    "physicalOnly": 2,
    "both": 18,
    "priceDifference": 15.51
  },
  "lastActivity": "2025-01-21T12:00:00.000Z",
  "scrapingStatus": {
    "lastScraped": "2025-01-21T10:00:00.000Z",
    "productsNeedingScraping": 8,
    "scrapingErrors": 0
  }
}
```

### Analytics Fields Explained

- **totalProducts**: Total number of products associated with the store
- **activeProducts**: Number of active (non-discontinued) products
- **totalLocations**: Total number of physical locations
- **activeLocations**: Number of active (open) locations
- **averageOnlinePrice**: Average price of online products
- **averagePhysicalPrice**: Average price of physical products
- **priceComparison**: Breakdown of product pricing types
- **lastActivity**: Last time the store was updated
- **scrapingStatus**: Information about automated price updates

## 👨‍💼 Admin Operations

### Admin Store List

**Endpoint**: `GET /stores/admin/stores`

**Access**: SUPER_ADMIN, ADMIN only

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by store status
- `type`: Filter by store type
- `category`: Filter by store category
- `isVerified`: Filter by verification status

### Verifying a Store

**Endpoint**: `PUT /stores/admin/stores/:id/verify`

**Access**: SUPER_ADMIN, ADMIN only

**Response**: Updated store with verification status

### Suspending a Store

**Endpoint**: `PUT /stores/admin/stores/:id/suspend`

**Access**: SUPER_ADMIN, ADMIN only

**Response**: Updated store with suspended status

## 🔍 Search & Filtering

### Text Search
Search across store name, description, and website:
```
GET /stores?search=electronics
```

### Geographic Filtering
Filter by country, state, or city:
```
GET /stores?country=United States&state=NY
```

### Status Filtering
Filter by store status:
```
GET /stores?status=active&isVerified=true
```

### Type Filtering
Filter by store type:
```
GET /stores?type=hybrid&hasPhysicalLocations=true
```

### Date Filtering
Filter by creation date:
```
GET /stores?createdAfter=2025-01-01&createdBefore=2025-01-31
```

## 📱 Store Types & Categories

### Store Types

| Type | Description | Physical Locations |
|------|-------------|-------------------|
| `online` | Online-only store | No |
| `physical` | Physical-only store | Yes |
| `hybrid` | Both online and physical | Yes |

### Store Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `electronics` | Electronic devices and gadgets | Phones, laptops, TVs |
| `clothing` | Apparel and accessories | Shirts, shoes, bags |
| `home_and_garden` | Home improvement and gardening | Tools, plants, furniture |
| `sports` | Sports equipment and athletic wear | Balls, shoes, equipment |
| `beauty` | Beauty and personal care | Cosmetics, skincare |
| `books` | Books and publications | Novels, textbooks |
| `automotive` | Automotive parts and accessories | Tires, oil, tools |
| `food_and_beverages` | Food and drink products | Groceries, beverages |
| `health` | Health and wellness | Vitamins, supplements |
| `toys` | Toys and games | Board games, action figures |
| `other` | Miscellaneous categories | Various products |

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Store with this name or website already exists",
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
  "message": "Only SUPER_ADMIN and ADMIN can create stores",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Store not found",
  "error": "Not Found"
}
```

### Validation Errors
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "website must be a valid URL",
    "latitude must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request"
}
```

## 📋 Best Practices

### Store Creation
1. **Use descriptive names** that clearly identify the store
2. **Provide detailed descriptions** to help users understand the store
3. **Include contact information** for customer support
4. **Set appropriate categories** for better organization
5. **Add metadata** for additional store features

### Physical Locations
1. **Use accurate coordinates** for proper mapping
2. **Include business hours** for customer convenience
3. **Add accessibility information** for inclusive access
4. **Provide parking details** for physical store visits
5. **Include location-specific notes** for unique features

### Store Management
1. **Regular updates** to keep store information current
2. **Monitor analytics** to track store performance
3. **Verify stores** to build customer trust
4. **Maintain accurate location data** for physical stores
5. **Use appropriate status** to reflect store conditions

## 🔗 Related Modules

- **Authentication Module**: User authentication and role management
- **Users Module**: User profile and preference management
- **Products Module**: Product catalog and management (future)
- **StoreProducts Module**: Store-specific product management (future)

## 📚 Additional Resources

- **API Documentation**: Swagger UI at `/api/docs`
- **Technical Documentation**: See `.dev/technical/STORES_MODULE_IMPLEMENTATION.md`
- **Database Schema**: Entity definitions and relationships
- **Permission Matrix**: Complete role-based access control details

---

*For technical implementation details, see the Stores Module Implementation document in `.dev/technical/`.*
