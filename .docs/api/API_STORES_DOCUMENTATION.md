# 📚 Documentación API - Gestión de Tiendas

## 🎯 Resumen General

Esta documentación describe todos los endpoints disponibles para la gestión de tiendas en el sistema Pritzio. La API permite crear, consultar, actualizar y eliminar tiendas, así como gestionar sus ubicaciones físicas y obtener analíticas.

**Base URL:** `https://api.pritzio.com/api/v1/stores`

---

## 🔐 Autenticación y Autorización

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:

```http
Authorization: Bearer <tu-jwt-token>
```

### Roles de Usuario:
- **SUPER_ADMIN**: Acceso completo a todas las operaciones
- **ADMIN**: Gestión de tiendas y verificación
- **STORE_ADMIN**: Gestión limitada de tiendas específicas

---

## 📋 Enums y Tipos de Datos

### StoreType
```typescript
enum StoreType {
  ONLINE = 'online',           // Solo tienda online
  PHYSICAL = 'physical',       // Solo tienda física
  HYBRID = 'hybrid'           // Tienda mixta (online + física)
}
```

### StoreStatus
```typescript
enum StoreStatus {
  ACTIVE = 'active',                           // Activa
  INACTIVE = 'inactive',                       // Inactiva
  SUSPENDED = 'suspended',                     // Suspendida
  PENDING_VERIFICATION = 'pending_verification' // Pendiente de verificación
}
```

### StoreCategory
```typescript
enum StoreCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  HOME_AND_GARDEN = 'home_and_garden',
  SPORTS = 'sports',
  BEAUTY = 'beauty',
  BOOKS = 'books',
  AUTOMOTIVE = 'automotive',
  FOOD_AND_BEVERAGES = 'food_and_beverages',
  HEALTH = 'health',
  TOYS = 'toys',
  OTHER = 'other'
}
```

---

## 🏪 Endpoints de Gestión de Tiendas

### 1. Crear Tienda

**POST** `/stores`

**Permisos:** SUPER_ADMIN, ADMIN

**Descripción:** Crea una nueva tienda en el sistema.

#### Request Body:
```json
{
  "name": "Electronics Store",
  "description": "Leading electronics retailer with best prices",
  "website": "https://electronicsstore.com",
  "logo": "https://electronicsstore.com/logo.png",
  "type": "hybrid",
  "status": "pending_verification",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@electronicsstore.com",
  "country": "United States",
  "timezone": "America/New_York",
  "metadata": {
    "socialMedia": {
      "facebook": "electronicsstore",
      "twitter": "@electronicsstore"
    }
  }
}
```

#### Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store",
  "description": "Leading electronics retailer with best prices",
  "website": "https://electronicsstore.com",
  "logo": "https://electronicsstore.com/logo.png",
  "type": "hybrid",
  "status": "pending_verification",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@electronicsstore.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": false,
  "verifiedAt": null,
  "verifiedBy": null,
  "metadata": {
    "socialMedia": {
      "facebook": "electronicsstore",
      "twitter": "@electronicsstore"
    }
  },
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Obtener Todas las Tiendas

**GET** `/stores`

**Permisos:** Todos los usuarios autenticados

**Descripción:** Obtiene una lista paginada de tiendas con filtros opcionales.

#### Query Parameters:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `page` | number | No | Número de página (default: 1) | `1` |
| `limit` | number | No | Elementos por página (default: 20) | `20` |
| `type` | StoreType | No | Filtrar por tipo de tienda | `hybrid` |
| `status` | StoreStatus | No | Filtrar por estado | `active` |
| `category` | StoreCategory | No | Filtrar por categoría | `electronics` |
| `country` | string | No | Filtrar por país | `United States` |
| `isVerified` | boolean | No | Filtrar por verificación | `true` |
| `hasPhysicalLocations` | boolean | No | Filtrar por ubicaciones físicas | `true` |
| `search` | string | No | Búsqueda en nombre, descripción o website | `electronics` |
| `createdAfter` | Date | No | Filtrar por fecha de creación (después) | `2024-01-01` |
| `createdBefore` | Date | No | Filtrar por fecha de creación (antes) | `2024-12-31` |

#### Ejemplo de Request:
```http
GET /stores?page=1&limit=10&type=hybrid&status=active&category=electronics&search=electronics
```

#### Response (200 OK):
```json
{
  "stores": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Electronics Store",
      "website": "https://electronicsstore.com",
      "logo": "https://electronicsstore.com/logo.png",
      "type": "hybrid",
      "status": "active",
      "category": "electronics",
      "country": "United States",
      "isVerified": true,
      "storeProductsCount": 150,
      "physicalLocationsCount": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "type": "hybrid",
    "status": "active",
    "category": "electronics",
    "search": "electronics"
  }
}
```

---

### 3. Obtener Tienda por ID

**GET** `/stores/{id}`

**Permisos:** Todos los usuarios autenticados

**Descripción:** Obtiene una tienda específica por su ID.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID único de la tienda |

#### Response (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store",
  "description": "Leading electronics retailer with best prices",
  "website": "https://electronicsstore.com",
  "logo": "https://electronicsstore.com/logo.png",
  "type": "hybrid",
  "status": "active",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@electronicsstore.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": true,
  "verifiedAt": "2024-01-16T09:00:00.000Z",
  "verifiedBy": "admin-uuid",
  "metadata": {
    "socialMedia": {
      "facebook": "electronicsstore",
      "twitter": "@electronicsstore"
    }
  },
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T09:00:00.000Z",
  "creator": {
    "id": "user-uuid",
    "username": "admin_user",
    "email": "admin@example.com",
    "roles": [
      {
        "id": "role-uuid",
        "name": "ADMIN",
        "displayName": "Administrator"
      }
    ]
  },
  "storeProductsCount": 150,
  "physicalLocationsCount": 3,
  "isVerified": true,
  "verificationStatus": "verified"
}
```

---

### 4. Actualizar Tienda

**PUT** `/stores/{id}`

**Permisos:** SUPER_ADMIN, ADMIN, STORE_ADMIN (solo su tienda)

**Descripción:** Actualiza una tienda existente.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID único de la tienda |

#### Request Body (todos los campos son opcionales):
```json
{
  "name": "Electronics Store Updated",
  "description": "Updated description",
  "website": "https://newelectronicsstore.com",
  "logo": "https://newelectronicsstore.com/logo.png",
  "type": "online",
  "status": "active",
  "category": "electronics",
  "phone": "+1-555-999-8888",
  "email": "newcontact@electronicsstore.com",
  "country": "Canada",
  "timezone": "America/Toronto",
  "metadata": {
    "socialMedia": {
      "facebook": "newelectronicsstore",
      "instagram": "@newelectronicsstore"
    }
  }
}
```

#### Response (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store Updated",
  "description": "Updated description",
  "website": "https://newelectronicsstore.com",
  "logo": "https://newelectronicsstore.com/logo.png",
  "type": "online",
  "status": "active",
  "category": "electronics",
  "phone": "+1-555-999-8888",
  "email": "newcontact@electronicsstore.com",
  "country": "Canada",
  "timezone": "America/Toronto",
  "isVerified": true,
  "verifiedAt": "2024-01-16T09:00:00.000Z",
  "verifiedBy": "admin-uuid",
  "metadata": {
    "socialMedia": {
      "facebook": "newelectronicsstore",
      "instagram": "@newelectronicsstore"
    }
  },
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T15:45:00.000Z"
}
```

---

### 5. Eliminar Tienda

**DELETE** `/stores/{id}`

**Permisos:** SUPER_ADMIN únicamente

**Descripción:** Elimina una tienda del sistema.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID único de la tienda |

#### Response (200 OK):
```json
{
  "message": "Store deleted successfully",
  "storeId": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 🏢 Endpoints de Ubicaciones Físicas

### 6. Agregar Ubicación Física

**POST** `/stores/{storeId}/locations`

**Permisos:** SUPER_ADMIN, ADMIN, STORE_ADMIN

**Descripción:** Agrega una nueva ubicación física a una tienda.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `storeId` | string (UUID) | Sí | ID de la tienda |

#### Request Body:
```json
{
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-123-4567",
  "hours": "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
  "status": "active"
}
```

#### Response (201 Created):
```json
{
  "id": "location-uuid",
  "storeId": "123e4567-e89b-12d3-a456-426614174000",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-123-4567",
  "hours": "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
  "status": "active",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 7. Actualizar Ubicación Física

**PUT** `/stores/locations/{locationId}`

**Permisos:** SUPER_ADMIN, ADMIN, STORE_ADMIN

**Descripción:** Actualiza una ubicación física existente.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `locationId` | string (UUID) | Sí | ID de la ubicación física |

#### Request Body (todos los campos son opcionales):
```json
{
  "address": "456 Updated Street",
  "city": "Brooklyn",
  "state": "NY",
  "zipCode": "11201",
  "phone": "+1-555-999-8888",
  "hours": "Mon-Sat: 8AM-8PM",
  "status": "active"
}
```

#### Response (200 OK):
```json
{
  "id": "location-uuid",
  "storeId": "123e4567-e89b-12d3-a456-426614174000",
  "address": "456 Updated Street",
  "city": "Brooklyn",
  "state": "NY",
  "zipCode": "11201",
  "country": "United States",
  "latitude": 40.6782,
  "longitude": -73.9442,
  "phone": "+1-555-999-8888",
  "hours": "Mon-Sat: 8AM-8PM",
  "status": "active",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T15:45:00.000Z"
}
```

---

### 8. Eliminar Ubicación Física

**DELETE** `/stores/locations/{locationId}`

**Permisos:** SUPER_ADMIN, ADMIN, STORE_ADMIN

**Descripción:** Elimina una ubicación física.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `locationId` | string (UUID) | Sí | ID de la ubicación física |

#### Response (200 OK):
```json
{
  "message": "Physical location deleted successfully",
  "locationId": "location-uuid"
}
```

---

## 📊 Endpoints de Analíticas

### 9. Obtener Analíticas de Tienda

**GET** `/stores/{id}/analytics`

**Permisos:** Todos los usuarios autenticados

**Descripción:** Obtiene analíticas completas de una tienda específica.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID de la tienda |

#### Response (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store",
  "totalProducts": 150,
  "activeProducts": 145,
  "totalLocations": 3,
  "activeLocations": 3,
  "averageOnlinePrice": 299.99,
  "averagePhysicalPrice": 289.99,
  "priceComparison": {
    "onlineOnly": 45,
    "physicalOnly": 30,
    "both": 70,
    "priceDifference": 10.00
  },
  "lastActivity": "2024-01-16T15:45:00.000Z",
  "scrapingStatus": {
    "lastScraped": "2024-01-16T14:30:00.000Z",
    "productsNeedingScraping": 5,
    "scrapingErrors": 2
  }
}
```

---

## 🔧 Endpoints de Administración

### 10. Obtener Tiendas para Administración

**GET** `/stores/admin/stores`

**Permisos:** SUPER_ADMIN, ADMIN únicamente

**Descripción:** Obtiene todas las tiendas para propósitos administrativos.

#### Query Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | number | No | Número de página (default: 1) |
| `limit` | number | No | Elementos por página (default: 50) |
| `status` | StoreStatus | No | Filtrar por estado |
| `type` | StoreType | No | Filtrar por tipo |
| `category` | StoreCategory | No | Filtrar por categoría |
| `isVerified` | boolean | No | Filtrar por verificación |

#### Response (200 OK):
```json
{
  "stores": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Electronics Store",
      "website": "https://electronicsstore.com",
      "logo": "https://electronicsstore.com/logo.png",
      "type": "hybrid",
      "status": "active",
      "category": "electronics",
      "country": "United States",
      "isVerified": true,
      "storeProductsCount": 150,
      "physicalLocationsCount": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "status": "active",
    "type": "hybrid",
    "category": "electronics",
    "isVerified": true
  }
}
```

---

### 11. Verificar Tienda

**PUT** `/stores/admin/stores/{id}/verify`

**Permisos:** SUPER_ADMIN, ADMIN únicamente

**Descripción:** Marca una tienda como verificada.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID de la tienda |

#### Response (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store",
  "description": "Leading electronics retailer with best prices",
  "website": "https://electronicsstore.com",
  "logo": "https://electronicsstore.com/logo.png",
  "type": "hybrid",
  "status": "active",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@electronicsstore.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": true,
  "verifiedAt": "2024-01-16T16:00:00.000Z",
  "verifiedBy": "admin-uuid",
  "metadata": {
    "socialMedia": {
      "facebook": "electronicsstore",
      "twitter": "@electronicsstore"
    }
  },
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T16:00:00.000Z"
}
```

---

### 12. Suspender Tienda

**PUT** `/stores/admin/stores/{id}/suspend`

**Permisos:** SUPER_ADMIN, ADMIN únicamente

**Descripción:** Suspende una tienda.

#### Path Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string (UUID) | Sí | ID de la tienda |

#### Response (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics Store",
  "description": "Leading electronics retailer with best prices",
  "website": "https://electronicsstore.com",
  "logo": "https://electronicsstore.com/logo.png",
  "type": "hybrid",
  "status": "suspended",
  "category": "electronics",
  "phone": "+1-555-123-4567",
  "email": "contact@electronicsstore.com",
  "country": "United States",
  "timezone": "America/New_York",
  "isVerified": true,
  "verifiedAt": "2024-01-16T09:00:00.000Z",
  "verifiedBy": "admin-uuid",
  "metadata": {
    "socialMedia": {
      "facebook": "electronicsstore",
      "twitter": "@electronicsstore"
    }
  },
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T16:30:00.000Z"
}
```

---

## ❌ Códigos de Error

### Códigos HTTP Comunes:

| Código | Descripción | Ejemplo |
|--------|-------------|---------|
| `200` | OK - Operación exitosa | Tienda obtenida correctamente |
| `201` | Created - Recurso creado | Tienda creada exitosamente |
| `400` | Bad Request - Error de validación | Datos de entrada inválidos |
| `401` | Unauthorized - No autenticado | Token JWT inválido o faltante |
| `403` | Forbidden - Sin permisos | Usuario sin permisos para la operación |
| `404` | Not Found - Recurso no encontrado | Tienda no existe |
| `409` | Conflict - Conflicto de datos | Nombre de tienda ya existe |
| `422` | Unprocessable Entity - Error de validación | Datos de validación fallidos |
| `500` | Internal Server Error - Error del servidor | Error interno del sistema |

### Ejemplos de Respuestas de Error:

#### 400 Bad Request:
```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 2 characters",
    "website must be a valid URL"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions to perform this action",
  "error": "Forbidden"
}
```

#### 404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Store with ID 123e4567-e89b-12d3-a456-426614174000 not found",
  "error": "Not Found"
}
```

#### 409 Conflict:
```json
{
  "statusCode": 409,
  "message": "Store with name 'Electronics Store' already exists",
  "error": "Conflict"
}
```

---

## 🔍 Validaciones

### Crear/Actualizar Tienda:

| Campo | Validaciones |
|-------|-------------|
| `name` | Requerido, 2-255 caracteres, único |
| `description` | Opcional, máximo 1000 caracteres |
| `website` | Requerido, URL válida, máximo 500 caracteres, único |
| `logo` | Opcional, URL válida, máximo 500 caracteres |
| `type` | Requerido, enum StoreType |
| `status` | Requerido, enum StoreStatus |
| `category` | Requerido, enum StoreCategory |
| `phone` | Opcional, máximo 100 caracteres |
| `email` | Opcional, email válido, máximo 255 caracteres |
| `country` | Opcional, máximo 100 caracteres |
| `timezone` | Opcional, máximo 100 caracteres |
| `metadata` | Opcional, objeto JSON |

### Crear/Actualizar Ubicación Física:

| Campo | Validaciones |
|-------|-------------|
| `address` | Requerido, máximo 500 caracteres |
| `city` | Requerido, máximo 100 caracteres |
| `state` | Requerido, máximo 100 caracteres |
| `zipCode` | Requerido, máximo 20 caracteres |
| `country` | Requerido, máximo 100 caracteres |
| `latitude` | Requerido, número decimal |
| `longitude` | Requerido, número decimal |
| `phone` | Opcional, máximo 100 caracteres |
| `hours` | Opcional, máximo 500 caracteres |
| `status` | Requerido, enum válido |

---

## 📝 Notas Importantes

1. **Paginación**: Todos los endpoints de lista soportan paginación con `page` y `limit`
2. **Filtros**: Los filtros se aplican con lógica AND (todos deben cumplirse)
3. **Búsqueda**: La búsqueda busca en nombre, descripción y website
4. **Fechas**: Todas las fechas están en formato ISO 8601 UTC
5. **IDs**: Todos los IDs son UUIDs v4
6. **Roles**: Los permisos se verifican en cada endpoint
7. **Validación**: Todos los datos de entrada se validan antes del procesamiento
8. **Logs**: Todas las operaciones se registran para auditoría

---

## 🚀 Ejemplos de Uso

### Crear una tienda completa:
```bash
curl -X POST "https://api.pritzio.com/api/v1/stores" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Tienda",
    "description": "Descripción de mi tienda",
    "website": "https://mitienda.com",
    "type": "hybrid",
    "status": "pending_verification",
    "category": "electronics",
    "country": "Chile",
    "timezone": "America/Santiago"
  }'
```

### Obtener tiendas con filtros:
```bash
curl -X GET "https://api.pritzio.com/api/v1/stores?type=hybrid&status=active&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Agregar ubicación física:
```bash
curl -X POST "https://api.pritzio.com/api/v1/stores/{storeId}/locations" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Av. Providencia 1234",
    "city": "Santiago",
    "state": "Metropolitana",
    "zipCode": "7500000",
    "country": "Chile",
    "latitude": -33.4489,
    "longitude": -70.6693,
    "phone": "+56-2-2345-6789",
    "hours": "Lun-Vie: 9:00-19:00, Sáb: 10:00-14:00"
  }'
```

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API, contacta al equipo de desarrollo:

- **Email**: dev@pritzio.com
- **Documentación**: https://docs.pritzio.com
- **Status**: https://status.pritzio.com

---

*Última actualización: 16 de Enero, 2024*
