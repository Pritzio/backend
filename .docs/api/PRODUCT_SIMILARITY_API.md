# Product Similarity API Documentation

## Overview

La API de Similitud de Productos permite encontrar productos similares basándose en nombre, marca y especificaciones. Utiliza el algoritmo inteligente de matching implementado en el sistema.

### Características Principales

- **Algoritmo Inteligente**: Utiliza el mismo algoritmo de matching que el sistema de duplicados
- **Verificación Estricta de Números**: Limita la similitud a 50% cuando los números son diferentes
- **Filtrado por Marca**: Opcional para buscar solo en productos de una marca específica
- **Respuestas Enriquecidas**: Incluye imágenes, URLs, y información de tiendas
- **Autenticación Requerida**: Todos los endpoints requieren autenticación JWT

## Endpoints

### 1. Find Similar Products

**POST** `/api/v1/products/similarity/find-similar`

Encuentra productos similares basándose en los datos proporcionados.

#### Request Body

```typescript
{
  name: string;                    // Nombre del producto (requerido)
  brand?: string;                  // Marca del producto (opcional)
  specifications?: object;         // Especificaciones del producto (opcional)
  threshold?: number;              // Umbral de similitud (0-1), Default: 0.8
  limit?: number;                  // Máximo número de resultados, Default: 10
}
```

#### Example Request

```bash
POST /api/v1/products/similarity/find-similar
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "toalla papel nova clasica 12m 12un",
  "brand": "nova",
  "threshold": 0.8,
  "limit": 5
}
```

#### Response

```typescript
{
  success: boolean;
  data: SimilarProduct[];
  total: number;
  threshold: number;
}

interface SimilarProduct {
  id: string;
  name: string;
  brand: string | null;
  image: string;                   // URL de la imagen del producto
  url: string | null;              // URL del producto en la tienda
  similarity: number;              // Similitud (0-1)
  storeCount: number;              // Número de tiendas que venden este producto
  totalVariants: number;           // Número total de variantes
  createdAt: string;               // Fecha de creación
  storeProducts: StoreProductInfo[];
}

interface StoreProductInfo {
  id: string;
  name: string;
  price: number;
  image: string;
  url: string | null;
  store: string;
}
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "toalla papel nova clasica 12m 12 un",
      "brand": "Nova",
      "image": "https://example.com/nova-clasica-12m-12un.jpg",
      "url": "https://tienda.com/nova-clasica-12m-12un",
      "similarity": 0.95,
      "storeCount": 3,
      "totalVariants": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "storeProducts": [
        {
          "id": "store-prod-1",
          "name": "toalla papel nova clasica 12m 12 un",
          "price": 2500,
          "image": "https://example.com/nova-clasica-store1.jpg",
          "url": "https://tienda.com/nova-clasica-12m-12un",
          "store": "Tienda A"
        }
      ]
    }
  ],
  "total": 1,
  "threshold": 0.8
}
```

### 2. Get Product Suggestions

**GET** `/api/v1/products/similarity/suggestions`

Obtiene sugerencias de productos basándose en una consulta de búsqueda.

#### Query Parameters

```typescript
{
  q: string;                       // Consulta de búsqueda (requerido)
  threshold?: number;              // Umbral de similitud (0-1), Default: 0.8
  limit?: number;                  // Máximo número de resultados, Default: 10
}
```

#### Example Request

```bash
GET /api/v1/products/similarity/suggestions?q=toalla%20papel%20nova&threshold=0.8&limit=5
Authorization: Bearer <token>
```

#### Response

```typescript
{
  success: boolean;
  data: SimilarProduct[];
  total: number;
  query: string;
}
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "toalla papel nova clasica 12m 12un",
      "brand": "Nova",
      "image": "https://example.com/nova-clasica.jpg",
      "url": "https://tienda.com/nova-clasica",
      "similarity": 0.92,
      "storeCount": 2,
      "totalVariants": 3
    }
  ],
  "total": 1,
  "query": "toalla papel nova"
}
```

## Algoritmo de Similitud

### Características del Algoritmo

1. **Verificación de Marca**: Si las marcas son diferentes, la similitud máxima es 30%
2. **Tipo de Producto**: Detecta categorías y solo agrupa productos del mismo tipo
3. **Análisis de Nombre**: Compara nombres normalizados con algoritmo Jaro-Winkler
4. **Verificación Estricta de Números**: Limita la similitud a 50% cuando los números son diferentes
5. **Mediciones**: Compara cantidades y dimensiones para productos similares

### Fórmula de Similitud

- 60% nombre del producto (más importante)
- 20% marca
- 15% tipo de producto  
- 5% medidas

### Penalizaciones Aplicadas

- 40% de penalización si los números en los nombres son diferentes
- Límite máximo de 50% si los números en los nombres son diferentes (verificación estricta)
- Límite máximo de 60% si la similitud de nombres es menor al 85%
- **100% de similitud solo para productos prácticamente idénticos (98%+ similitud de nombre)**
- **99% máximo para productos muy similares pero no idénticos**
- **94% máximo para productos similares normales**

### Ejemplos de Similitud

**✅ Productos Idénticos (100% similitud):**
- "toalla papel nova clasica 12m 12un" + "toalla papel nova clasica 12m 12un" = 100% similitud

**✅ Productos Muy Similares (99% similitud):**
- "toalla papel nova clasica 12m 12un" + "toalla papel nova clasica 12m 12 un" = 99% similitud

**✅ Productos Similares (94% similitud):**
- "toalla papel nova evolution 26m 2un" + "toalla papel nova ultra 26m 2un" = 94% similitud

**❌ Productos Diferentes (Números Diferentes):**
- "toalla papel nova clasica 12m 12un" + "toalla papel nova clasica 12m 3un" = 50% similitud (CAPPED)
- "toalla papel nova clasica 12m 12un" + "toalla papel nova clasica 40m 1un" = 50% similitud (CAPPED)

## Códigos de Estado HTTP

- **200 OK**: Solicitud exitosa
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Token de autenticación inválido o faltante
- **403 Forbidden**: Permisos insuficientes
- **500 Internal Server Error**: Error interno del servidor

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Roles Requeridos

- `ADMIN`: Acceso completo a todos los endpoints
- `SUPER_ADMIN`: Acceso completo a todos los endpoints
- `STORE_ADMIN`: Acceso completo a todos los endpoints

## Ejemplos de Uso

### Frontend Integration

```javascript
// Find similar products
const findSimilarProducts = async (productData) => {
  const response = await fetch('/api/v1/products/similarity/find-similar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: productData.name,
      brand: productData.brand,
      threshold: 0.8,
      limit: 10
    })
  });
  
  return await response.json();
};

// Get product suggestions
const getProductSuggestions = async (query) => {
  const response = await fetch(`/api/v1/products/similarity/suggestions?q=${encodeURIComponent(query)}&threshold=0.8&limit=5`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const ProductSimilarity = ({ product }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const findSimilar = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/products/similarity/find-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: product.name,
          brand: product.brand,
          threshold: 0.8,
          limit: 5
        })
      });
      
      const data = await response.json();
      setSimilarProducts(data.data);
    } catch (error) {
      console.error('Error finding similar products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      findSimilar();
    }
  }, [product]);

  return (
    <div className="similar-products">
      <h3>Productos Similares</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="product-list">
          {similarProducts.map((similarProduct) => (
            <div key={similarProduct.id} className="product-card">
              <img src={similarProduct.image} alt={similarProduct.name} />
              <h4>{similarProduct.name}</h4>
              <p>Marca: {similarProduct.brand}</p>
              <p>Similitud: {(similarProduct.similarity * 100).toFixed(1)}%</p>
              <p>Tiendas: {similarProduct.storeCount}</p>
              {similarProduct.url && (
                <a href={similarProduct.url} target="_blank" rel="noopener noreferrer">
                  Ver en tienda
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSimilarity;
```

## Troubleshooting

### Problemas Comunes

1. **404 Not Found**: Verifica que el endpoint esté correctamente registrado en el módulo
2. **401 Unauthorized**: Verifica que el token JWT sea válido y no haya expirado
3. **403 Forbidden**: Verifica que el usuario tenga los permisos necesarios
4. **400 Bad Request**: Verifica que los datos de entrada sean válidos

### Debugging

Para debuggear problemas de similitud:

1. Verifica que el algoritmo esté aplicando las verificaciones estrictas de números
2. Revisa los logs del servidor para ver los cálculos de similitud
3. Prueba con diferentes umbrales de similitud
4. Verifica que los productos base estén activos

## Notas

- El algoritmo utiliza el mismo sistema de matching que el endpoint de duplicados
- Las verificaciones estrictas de números previenen agrupaciones incorrectas
- Las respuestas incluyen URLs e imágenes para mejor experiencia de usuario
- El sistema está optimizado para manejar grandes volúmenes de productos
