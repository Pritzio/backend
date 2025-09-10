# Base Products Admin API Documentation

## Overview
Esta documentación describe los endpoints para la administración completa de productos base, incluyendo CRUD operations, asociación de productos de tienda, y gestión de agrupaciones.

### 🚀 **Características Principales:**
- **Algoritmo Experto de Matching**: Agrupa automáticamente productos idénticos basado en marca, modelo y mediciones
- **Gestión de Asociaciones**: Asociación manual de productos de tienda a productos base
- **Detección de Duplicados**: Identificación y fusión de productos duplicados
- **Búsqueda Avanzada**: Filtros por marca, categoría, precio y estado
- **CRUD Completo**: Crear, leer, actualizar y eliminar productos base
- **Soft Delete**: Eliminación lógica para mantener integridad de datos

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Todos los endpoints requieren autenticación JWT y roles de administrador.

### Headers Required
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Roles Required
- `SUPER_ADMIN`
- `ADMIN`
- `STORE_ADMIN` (para algunos endpoints)

---

## 1. Algoritmo Experto de Matching

### 1.1 Cómo Funciona
El sistema crea un producto base individual para cada producto de tienda:

- **NO hay agrupación automática** - Cada producto de tienda tiene su propio producto base
- **Relación 1:1** - Un producto de tienda = Un producto base
- **Asociación manual** - Los administradores pueden asociar productos manualmente
- **Creación automática** - Se crea un producto base si no existe

### 1.2 Comportamiento Actual
- **Productos nuevos**: Siempre crean un producto base individual
- **Sin matching automático**: No se agrupan productos similares automáticamente
- **Control manual**: Los administradores deciden qué productos agrupar
- **Flexibilidad total**: Cada producto mantiene su identidad única

### 1.3 Ejemplos de Comportamiento
```typescript
// ✅ CADA UNO CREA SU PROPIO PRODUCTO BASE
"Toalla de papel nova evolution megarollo 2 un de 26 m" → BaseProduct A
"Toalla de Papel Nova Evolution Mega Rollo 26 m 2 un." → BaseProduct B
"Toalla de papel nova evolution megarollo 3 un de 14 m" → BaseProduct C

// ❌ NO SE AGRUPAN AUTOMÁTICAMENTE
// Los administradores pueden asociarlos manualmente si es necesario
```

---

## 2. Base Products CRUD

### 2.1 Get All Base Products
**GET** `/admin/products/base-products`

Obtiene todos los productos base con paginación y filtros.

#### Query Parameters
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20
  search?: string;      // Search by name or brand
  brand?: string;       // Filter by brand
  isActive?: boolean;   // Filter by active status
  sortBy?: string;      // Sort field (name, brand, createdAt, storeCount)
  sortOrder?: 'ASC' | 'DESC'; // Sort order
}
```

#### Response
```typescript
{
  data: BaseProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BaseProduct {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  fullName: string;
  specifications: Record<string, any>;
  isActive: boolean;
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  updatedAt: string;
  storeProducts: StoreProductSummary[];
}

interface StoreProductSummary {
  id: string;
  name: string;
  price: number;
  store: {
    id: string;
    name: string;
    website: string;
  };
  createdAt: string;
}
```

#### Example Request
```bash
GET /admin/products/base-products?page=1&limit=10&search=nova&isActive=true
```

### 2.2 Get Base Product by ID
**GET** `/admin/products/base-product/:id`

Obtiene un producto base específico con todos sus productos de tienda asociados.

#### Path Parameters
- `id`: UUID del producto base

#### Response
```typescript
{
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  fullName: string;
  specifications: Record<string, any>;
  isActive: boolean;
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  updatedAt: string;
  storeProducts: StoreProductSummary[];
}
```

### 2.3 Create Base Product
**POST** `/admin/products/base-product`

Crea un nuevo producto base.

#### Request Body
```typescript
{
  name: string;                    // Required
  brand?: string;                  // Optional
  model?: string;                  // Optional
  sku?: string;                    // Optional
  specifications?: Record<string, any>; // Optional
  isActive?: boolean;              // Default: true
}
```

#### Response
```typescript
{
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  fullName: string;
  specifications: Record<string, any>;
  isActive: boolean;
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Update Base Product
**PUT** `/admin/products/base-product/:id`

Actualiza un producto base existente.

#### Path Parameters
- `id`: UUID del producto base

#### Request Body
```typescript
{
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  specifications?: Record<string, any>;
  isActive?: boolean;
}
```

#### Response
```typescript
{
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  fullName: string;
  specifications: Record<string, any>;
  isActive: boolean;
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.5 Delete Base Product
**DELETE** `/admin/products/base-product/:id`

Elimina un producto base (soft delete - marca como inactivo) y desasocia automáticamente todos los productos de tienda asociados.

#### Path Parameters
- `id`: UUID del producto base

#### Response
```typescript
{
  message: string;
  baseProductId: string;
  disassociatedStoreProducts: number;
  isActive: false;
}
```

#### Comportamiento
- **Desasocia automáticamente** todos los productos de tienda asociados
- **Marca como inactivo** el producto base (`isActive: false`)
- Los productos de tienda quedan **huérfanos** (sin producto base)
- **Se puede reactivar** cambiando `isActive` a `true`

### 2.6 Hard Delete Base Product
**DELETE** `/admin/products/base-product/:id/hard`

Elimina permanentemente un producto base y desasocia todos sus productos de tienda.

#### Path Parameters
- `id`: UUID del producto base

#### Response
```typescript
{
  message: string;
  baseProductId: string;
  disassociatedStoreProducts: number;
}
```

---

## 3. Scraping & Product Creation

### 3.1 Add Scraped Products
**POST** `/store-products/scraping/add-products`

Agrega productos desde scraping creando un producto base individual para cada producto (sin agrupación automática).

#### Request Body
```typescript
[
  {
    name: string;                    // Required
    description?: string;            // Optional
    url?: string;                    // Optional
    sku?: string;                    // Optional
    storeProductId: string;          // Required (min 3 chars, max 100 chars)
    image?: string;                  // Optional
    price?: number;                  // Optional
    metadata?: {                     // Optional
      brand?: string;
      model?: string;
      categories?: string[];
      specifications?: Record<string, any>;
    };
  }
]
```

#### Response
```typescript
{
  results: Array<{
    success: boolean;
    createdProduct?: StoreProduct;
    matchedBaseProduct?: BaseProduct;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    grouped: number;
    newBaseProducts: number;
  };
}
```

#### Example Request
```bash
POST /store-products/scraping/add-products
Content-Type: application/json
Authorization: Bearer <jwt_token>

[
  {
    "name": "Toalla de papel nova evolution megarollo 2 un de 26 m",
    "storeProductId": "nova-evo-2-26-001",
    "price": 2500,
    "metadata": {
      "brand": "Nova",
      "model": "Evolution",
      "categories": ["Toallas de Papel"]
    }
  }
]
```

---

## 4. Store Products Management

### 4.1 Get Unassociated Store Products
**GET** `/admin/products/store-products/unassociated`

Obtiene todos los productos de tienda que no están asociados a ningún producto base.

#### Query Parameters
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20
  storeId?: string;     // Filter by store
  search?: string;      // Search by name
}
```

#### Response
```typescript
{
  data: StoreProduct[];
  total: number;
  page: number;
  limit: number;
}

interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  sku: string | null;
  storeProductId: string | null;
  image: string | null;
  price: number | null;
  lastScraped: string | null;
  createdAt: string;
  store: {
    id: string;
    name: string;
    website: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

### 4.2 Associate Store Product to Base Product
**POST** `/admin/products/associate-store-product`

Asocia un producto de tienda a un producto base.

#### Request Body
```typescript
{
  storeProductId: string;  // Required
  baseProductId: string;   // Required
}
```

#### Response
```typescript
{
  message: string;
  storeProductId: string;
  baseProductId: string;
  association: {
    storeProduct: StoreProductSummary;
    baseProduct: BaseProductSummary;
  };
}
```

### 4.3 Disassociate Store Product
**POST** `/admin/products/disassociate-store-product`

Desasocia un producto de tienda de su producto base.

#### Request Body
```typescript
{
  storeProductId: string;  // Required
}
```

#### Response
```typescript
{
  message: string;
  storeProductId: string;
  baseProductId: string | null;
}
```

---

## 5. Product Matching & Suggestions

### 5.1 Get Product Duplicates
**GET** `/admin/products/duplicates`

Obtiene productos base que son realmente similares (85%+ similitud) con análisis inteligente de tipo de producto, marca y mediciones. Incluye imágenes para fácil identificación.

#### Algoritmo Inteligente de Detección

El algoritmo utiliza múltiples criterios para determinar si dos productos son realmente similares:

1. **Verificación de Marca**: Si las marcas son diferentes, la similitud máxima es 30%
2. **Tipo de Producto**: Detecta categorías (alcohol wipes, paper towels, etc.) y solo agrupa productos del mismo tipo
3. **Análisis de Nombre**: Compara nombres normalizados con algoritmo Jaro-Winkler
4. **Comparación Estricta de Números**: Extrae y compara todos los números en los nombres
5. **Mediciones**: Compara cantidades y dimensiones para productos similares

**Fórmula de Similitud Mejorada**:
- 60% nombre del producto (más importante)
- 20% marca
- 15% tipo de producto  
- 5% medidas

**Penalizaciones Aplicadas**:
- 40% de penalización si los números en los nombres son diferentes
- Límite máximo de 50% si los números en los nombres son diferentes (verificación estricta)
- Límite máximo de 60% si la similitud de nombres es menor al 85%

**Ejemplos de Detección Correcta:**
- ✅ **MISMO TIPO, NÚMEROS IGUALES**: "toallas alcohol difem pharma 50un" + "toallas alcohol difem pharma 50 unidades" = 95% similitud
- ✅ **MISMO TIPO, NÚMEROS SIMILARES**: "toalla papel nova 26m 2un" + "toalla papel nova 26m 2 un" = 92% similitud
- ❌ **TIPOS DIFERENTES**: "toallas alcohol difem pharma" + "toalla papel home care" = 25% similitud
- ❌ **NÚMEROS DIFERENTES**: "toalla papel nova 12m 12un" + "toalla papel nova 12m 3un" = 50% similitud (12 vs 3) - CAPPED
- ❌ **NÚMEROS DIFERENTES**: "toalla papel nova 40m 1un" + "toalla papel nova 12m 12un" = 50% similitud (40,1 vs 12,12) - CAPPED

#### Query Parameters
```typescript
{
  threshold?: number;    // Similarity threshold (0-1), Default: 0.8
  limit?: number;        // Max results, Default: 50
  brand?: string;        // Filter by brand name
}
```

#### Response
```typescript
DuplicateGroup[]

interface DuplicateGroup {
  id: string;                    // Group identifier
  avgSimilarity: number;         // Average similarity (0-1) - only 85%+ shown
  threshold: number;             // Threshold used
  count: number;                 // Number of products in group
  brand: string;                 // Brand name
  image: string;                 // Product image URL
  totalStores: number;           // Total unique stores
  totalVariants: number;         // Total variants across all products
  products: ProductSummary[];    // Products in the group
}

interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  image: string;                 // Product image URL
  url: string | null;            // Product URL (from first store product)
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  storeProducts: StoreProductSummary[];
}

interface StoreProductSummary {
  id: string;
  name: string;
  price: number;
  image: string;                 // Store product image URL
  url: string | null;            // Store product URL
  store: string;
}
```

#### Example Request
```bash
GET /admin/products/duplicates?threshold=0.85&limit=20&brand=nova
```

#### Example Response
```json
[
  {
    "id": "group_123e4567-e89b-12d3-a456-426614174000",
    "avgSimilarity": 0.92,
    "threshold": 0.85,
    "count": 3,
    "brand": "Nova",
    "image": "https://example.com/nova-evolution.jpg",
    "totalStores": 5,
    "totalVariants": 8,
    "products": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Toalla de papel nova evolution megarollo 2 un de 26 m",
        "brand": "Nova",
        "image": "https://example.com/nova-evolution-1.jpg",
        "url": "https://tienda-a.com/productos/nova-evolution-26m",
        "storeCount": 3,
        "totalVariants": 5,
        "createdAt": "2024-01-15T10:30:00Z",
        "storeProducts": [
          {
            "id": "store-prod-1",
            "name": "Toalla de papel nova evolution megarollo 2 un de 26 m",
            "price": 2500,
            "image": "https://example.com/nova-evolution-store1.jpg",
            "url": "https://tienda-a.com/productos/nova-evolution-26m",
            "store": "Tienda A"
          }
        ]
      },
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "name": "Toalla de Papel Nova Evolution Mega Rollo 26 m 2 un.",
        "brand": "Nova",
        "image": "https://example.com/nova-evolution-2.jpg",
        "url": "https://tienda-b.com/productos/nova-evolution-mega-rollo",
        "storeCount": 2,
        "totalVariants": 3,
        "createdAt": "2024-01-16T14:20:00Z",
        "storeProducts": [
          {
            "id": "store-prod-2",
            "name": "Toalla de Papel Nova Evolution Mega Rollo 26 m 2 un.",
            "price": 2600,
            "image": "https://example.com/nova-evolution-store2.jpg",
            "url": "https://tienda-b.com/productos/nova-evolution-mega-rollo",
            "store": "Tienda B"
          }
        ]
      }
    ]
  }
]
```

### 5.2 Merge Duplicate Products
**POST** `/admin/products/merge`

Fusiona productos base duplicados.

#### Request Body
```typescript
{
  targetProductId: string;    // Product to keep
  duplicateProductIds: string[]; // Products to merge
  mergeData?: {
    name?: string;
    brand?: string;
    model?: string;
    specifications?: Record<string, any>;
  };
}
```

#### Response
```typescript
{
  message: string;
  mergedProduct: BaseProduct;
  mergedCount: number;
  disassociatedProducts: string[];
}
```

### 5.3 Get Association Suggestions
**POST** `/admin/products/suggest-associations`

Obtiene sugerencias de asociación para productos de tienda no asociados.

#### Request Body
```typescript
{
  storeProductId: string;   // Required - Store product ID
  threshold?: number;       // Similarity threshold, Default: 0.7
}
```

#### Response
```typescript
{
  storeProduct: StoreProduct;
  suggestions: AssociationSuggestion[];
}

interface AssociationSuggestion {
  baseProduct: BaseProduct;
  similarity: number;
  matchReason: string;
}
```

### 5.4 Get Unassociated Store Products with Suggestions
**GET** `/admin/products/store-products/unassociated-with-suggestions`

Obtiene productos de tienda no asociados con sugerencias de asociación.

#### Query Parameters
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20
  storeId?: string;     // Filter by store
  search?: string;      // Search by name
  includeSuggestions?: boolean; // Include suggestions, Default: true
}
```

#### Response
```typescript
{
  data: StoreProductWithSuggestions[];
  total: number;
  page: number;
  limit: number;
}

interface StoreProductWithSuggestions {
  storeProduct: StoreProduct;
  suggestions: AssociationSuggestion[];
  bestMatch: AssociationSuggestion | null;
}
```

---

## 6. Product Comparison & Search

### 6.1 Search Products
**GET** `/product-comparison/search`

Busca productos para comparación (endpoint público).

#### Query Parameters
```typescript
{
  q: string;            // Search query
  brand?: string;       // Filter by brand
  category?: string;    // Filter by category
  minPrice?: number;    // Minimum price
  maxPrice?: number;    // Maximum price
  limit?: number;       // Max results, Default: 20
}
```

#### Response
```typescript
{
  data: ProductComparisonItem[];
  total: number;
  query: string;
  filters: {
    brand?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

interface ProductComparisonItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  fullName: string;
  storeCount: number;
  totalVariants: number;
  image: string | null;
  specifications: {
    rating: number | null;
    categories: string[];
    originalData: Record<string, any>;
  };
  createdAt: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  stores: StoreSummary[];
}

interface StoreSummary {
  id: string;
  name: string;
  website: string;
  price: number;
  lastUpdated: string;
}
```

### 6.2 Get Product Comparison Details
**GET** `/product-comparison/:id`

Obtiene detalles completos de un producto para comparación.

#### Path Parameters
- `id`: UUID del producto base

#### Response
```typescript
{
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  fullName: string;
  specifications: Record<string, any>;
  storeCount: number;
  totalVariants: number;
  image: string | null;
  createdAt: string;
  storeProducts: StoreProductComparison[];
  priceAnalysis: {
    min: number;
    max: number;
    average: number;
    median: number;
    range: number;
  };
  availability: {
    totalStores: number;
    activeStores: number;
    lastUpdated: string;
  };
}

interface StoreProductComparison {
  id: string;
  name: string;
  price: number;
  url: string | null;
  image: string | null;
  store: {
    id: string;
    name: string;
    website: string;
    type: string;
    isVerified: boolean;
  };
  lastScraped: string;
  metadata: Record<string, any>;
}
```

---

## 7. Error Handling

### Error Response Format
```typescript
{
  message: string | string[];
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## 8. Frontend Implementation Examples

### 8.1 Base Products List Component
```typescript
// React component example
const BaseProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const fetchProducts = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/v1/admin/products/base-products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Product list UI */}
    </div>
  );
};
```

### 8.2 Product Association Component
```typescript
const ProductAssociation = ({ storeProductId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/products/suggest-associations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeProductId,
          threshold: 0.7
        })
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const associateProduct = async (baseProductId) => {
    try {
      const response = await fetch('/api/v1/admin/products/associate-store-product', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeProductId,
          baseProductId
        })
      });
      
      if (response.ok) {
        // Success - refresh data
        getSuggestions();
      }
    } catch (error) {
      console.error('Error associating product:', error);
    }
  };

  return (
    <div>
      {/* Association UI */}
    </div>
  );
};
```

---

## 9. Postman Collection

Se incluye una colección de Postman con todos los endpoints configurados y ejemplos de requests.

**Archivo:** `.docs/api/BASE_PRODUCTS_ADMIN_POSTMAN_COLLECTION.json`

---

## 10. Troubleshooting & Best Practices

### 10.1 Problemas Comunes

#### Error 404 en endpoints de productos base
**Problema**: El frontend recibe 404 al intentar acceder a productos base.
**Solución**: Verificar que el servidor esté corriendo y que los endpoints estén implementados.

#### Error de autenticación
**Problema**: "Invalid credentials" al hacer login.
**Solución**: 
- Verificar que el usuario existe en la base de datos
- Usar el campo `identifier` en lugar de `email` en el login
- Crear un super admin con el script `./scripts/create-super-admin.sh`

#### Productos no se agrupan automáticamente
**Problema**: Productos idénticos no se agrupan en un solo producto base.
**Solución**: 
- **Esto es el comportamiento esperado** - No hay agrupación automática
- Cada producto de tienda crea su propio producto base individual
- Los administradores deben asociar productos manualmente si es necesario
- Usar el endpoint de sugerencias para encontrar productos similares

#### Productos quedan huérfanos al desactivar
**Problema**: Al desactivar un producto base, los productos de tienda quedan sin agrupar.
**Solución**: 
- **Esto es el comportamiento esperado** - los productos se desasocian automáticamente
- Los productos de tienda aparecerán como productos individuales
- Se pueden reasociar manualmente a otro producto base si es necesario

#### Error de validación en scraping
**Problema**: "identifier must be shorter than or equal to 255 characters".
**Solución**: 
- El `storeProductId` debe tener entre 3 y 100 caracteres
- Usar identificadores únicos y descriptivos

### 10.2 Mejores Prácticas

#### Para el Frontend
- Siempre manejar errores de autenticación (401, 403)
- Implementar retry logic para requests fallidos
- Usar paginación para listas grandes
- Validar datos antes de enviar requests

#### Para el Backend
- Mantener el algoritmo experto actualizado
- Monitorear el rendimiento de las consultas
- Implementar logging detallado para debugging
- Validar datos de entrada en todos los endpoints

#### Para el Scraping
- Usar `storeProductId` únicos y descriptivos
- Incluir metadata completa (brand, model, categories)
- Validar URLs de imágenes antes de guardar
- Implementar rate limiting para evitar sobrecarga

## 11. Notes

- Todos los timestamps están en formato ISO 8601
- Los precios se manejan como enteros (centavos)
- Las imágenes deben ser URLs válidas
- Los UUIDs siguen el formato estándar v4
- La paginación es 1-indexed
- Los filtros de búsqueda son case-insensitive
- Las asociaciones de productos son inmutables una vez creadas (requieren desasociación explícita)
- **NO hay agrupación automática** - Cada producto de tienda crea su propio producto base
- Los administradores pueden asociar productos manualmente usando las sugerencias
- Se mantiene la flexibilidad total para decidir qué productos agrupar
- **Soft Delete**: Al desactivar un producto base, se desasocian automáticamente todos los productos de tienda
- **Hard Delete**: Elimina permanentemente el producto base y desasocia todos los productos de tienda
- Los productos desasociados quedan **huérfanos** y aparecen como productos individuales
