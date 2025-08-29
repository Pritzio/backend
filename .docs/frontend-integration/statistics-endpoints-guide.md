# 🚀 Guía de Integración Frontend - Endpoints de Estadísticas

## 📋 **Información para el Equipo de Frontend**

**Estado:** ✅ **IMPLEMENTADO Y DISPONIBLE**  
**Fecha de Implementación:** 2025-08-29  
**Versión de la API:** 1.0  

---

## 🎯 **Endpoints Disponibles**

### **Base URL:** `http://localhost:3000/api/v1/statistics`

---

## 📊 **1. Estadísticas de Usuarios**

### **Endpoint:**
```http
GET /api/v1/statistics/users
```

### **Headers Requeridos:**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### **Respuesta Exitosa (200):**
```json
{
  "total": 157,
  "active": 142,
  "inactive": 8,
  "pendingVerification": 5,
  "suspended": 2,
  "deleted": 0
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | `number` | Total de usuarios registrados |
| `active` | `number` | Usuarios activos |
| `inactive` | `number` | Usuarios inactivos |
| `pendingVerification` | `number` | Pendientes de verificación de email |
| `suspended` | `number` | Usuarios suspendidos |
| `deleted` | `number` | Usuarios eliminados (soft delete) |

---

## 🏪 **2. Estadísticas de Tiendas**

### **Endpoint:**
```http
GET /api/v1/statistics/stores
```

### **Respuesta Exitosa (200):**
```json
{
  "total": 45,
  "verified": 38,
  "pendingVerification": 5,
  "suspended": 2,
  "deleted": 0
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | `number` | Total de tiendas registradas |
| `verified` | `number` | Tiendas verificadas y activas |
| `pendingVerification` | `number` | Pendientes de verificación |
| `suspended` | `number` | Tiendas suspendidas |
| `deleted` | `number` | Tiendas eliminadas |

---

## 📦 **3. Estadísticas de Productos**

### **Endpoint:**
```http
GET /api/v1/statistics/products
```

### **Respuesta Exitosa (200):**
```json
{
  "total": 1250,
  "active": 1180,
  "inactive": 70,
  "deleted": 0
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | `number` | Total de productos en catálogo |
| `active` | `number` | Productos activos y disponibles |
| `inactive` | `number` | Productos inactivos o descontinuados |
| `deleted` | `number` | Productos eliminados |

---

## 🖥️ **4. Estadísticas del Sistema (Consolidado)**

### **Endpoint:**
```http
GET /api/v1/statistics/system
```

### **Respuesta Exitosa (200):**
```json
{
  "users": {
    "total": 157,
    "active": 142,
    "inactive": 8,
    "pendingVerification": 5,
    "suspended": 2,
    "deleted": 0
  },
  "stores": {
    "total": 45,
    "verified": 38,
    "pendingVerification": 5,
    "suspended": 2,
    "deleted": 0
  },
  "products": {
    "total": 1250,
    "active": 1180,
    "inactive": 70,
    "deleted": 0
  },
  "lastUpdated": "2025-08-29T18:45:23.456Z"
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `users` | `object` | Estadísticas completas de usuarios |
| `stores` | `object` | Estadísticas completas de tiendas |
| `products` | `object` | Estadísticas completas de productos |
| `lastUpdated` | `string` | Timestamp de última actualización (ISO 8601) |

---

## 👥 **5. Usuarios por Rol**

### **Endpoint:**
```http
GET /api/v1/statistics/users/by-role
```

### **Respuesta Exitosa (200):**
```json
{
  "customer": 150,
  "admin": 5,
  "super_admin": 2
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `customer` | `number` | Total de usuarios con rol customer |
| `admin` | `number` | Total de usuarios con rol admin |
| `super_admin` | `number` | Total de usuarios con rol super_admin |

---

## 🏪 **6. Tiendas por Estado de Verificación**

### **Endpoint:**
```http
GET /api/v1/statistics/stores/by-status
```

### **Respuesta Exitosa (200):**
```json
{
  "verified": 38,
  "pending": 5,
  "suspended": 2
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `verified` | `number` | Tiendas verificadas |
| `pending` | `number` | Tiendas pendientes de verificación |
| `suspended` | `number` | Tiendas suspendidas |

---

## 📦 **7. Productos por Categoría**

### **Endpoint:**
```http
GET /api/v1/statistics/products/by-category
```

### **Respuesta Exitosa (200):**
```json
{
  "electronics": 450,
  "clothing": 320,
  "home_and_garden": 280,
  "sports": 200
}
```

### **Campos de Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `{category_name}` | `number` | Número de productos en esa categoría |

---

## 🔐 **Autenticación y Permisos**

### **Requisitos:**
- **Token JWT válido** en el header `Authorization`
- **Rol requerido:** `admin` o `super_admin`
- **Permisos:** `analytics:read`, `store:read`, `product:read`

### **Ejemplo de Header:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚨 **Manejo de Errores**

### **401 Unauthorized:**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### **403 Forbidden:**
```json
{
  "message": "Insufficient permissions to access analytics",
  "error": "Forbidden",
  "statusCode": 403
}
```

### **500 Internal Server Error:**
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## 💻 **Ejemplos de Implementación**

### **JavaScript/TypeScript - Fetch API:**
```typescript
interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  pendingVerification: number;
  suspended: number;
  deleted: number;
}

const getUserStatistics = async (token: string): Promise<UserStatistics> => {
  const response = await fetch('/api/v1/statistics/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
```

### **React Hook Personalizado:**
```typescript
import { useState, useEffect } from 'react';

interface SystemStatistics {
  users: UserStatistics;
  stores: StoreStatistics;
  products: ProductStatistics;
  lastUpdated: string;
}

const useSystemStatistics = (token: string) => {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/statistics/system', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStatistics();
    }
  }, [token]);

  return { statistics, loading, error };
};
```

### **Componente React de Dashboard:**
```tsx
import React from 'react';
import { useSystemStatistics } from './hooks/useSystemStatistics';

const StatisticsDashboard: React.FC<{ token: string }> = ({ token }) => {
  const { statistics, loading, error } = useSystemStatistics(token);

  if (loading) return <div>Cargando estadísticas...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statistics) return <div>No hay datos disponibles</div>;

  return (
    <div className="statistics-dashboard">
      <h2>Dashboard de Estadísticas</h2>
      
      <div className="stats-grid">
        {/* Usuarios */}
        <div className="stat-card users">
          <h3>👥 Usuarios</h3>
          <div className="stat-number">{statistics.users.total}</div>
          <div className="stat-details">
            <span>Activos: {statistics.users.active}</span>
            <span>Pendientes: {statistics.users.pendingVerification}</span>
            <span>Suspendidos: {statistics.users.suspended}</span>
          </div>
        </div>
        
        {/* Tiendas */}
        <div className="stat-card stores">
          <h3>🏪 Tiendas</h3>
          <div className="stat-number">{statistics.stores.total}</div>
          <div className="stat-details">
            <span>Verificadas: {statistics.stores.verified}</span>
            <span>Pendientes: {statistics.stores.pendingVerification}</span>
            <span>Suspendidas: {statistics.stores.suspended}</span>
          </div>
        </div>
        
        {/* Productos */}
        <div className="stat-card products">
          <h3>📦 Productos</h3>
          <div className="stat-number">{statistics.products.total}</div>
          <div className="stat-details">
            <span>Activos: {statistics.products.active}</span>
            <span>Inactivos: {statistics.products.inactive}</span>
          </div>
        </div>
      </div>
      
      <div className="last-updated">
        Última actualización: {new Date(statistics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default StatisticsDashboard;
```

---

## 🧪 **Testing de Endpoints**

### **1. Obtener Token de Admin:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@pritzio.com",
    "password": "AdminPass123!"
  }'
```

### **2. Probar Endpoint de Usuarios:**
```bash
curl -X GET http://localhost:3000/api/v1/statistics/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **3. Probar Endpoint del Sistema:**
```bash
curl -X GET http://localhost:3000/api/v1/statistics/system \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📱 **Casos de Uso Recomendados**

### **Dashboard Principal:**
- Usar `/api/v1/statistics/system` para obtener todas las métricas
- Mostrar números principales en tarjetas grandes
- Incluir timestamp de última actualización

### **Página de Usuarios:**
- Usar `/api/v1/statistics/users` para métricas específicas
- Usar `/api/v1/statistics/users/by-role` para distribución por roles

### **Página de Tiendas:**
- Usar `/api/v1/statistics/stores` para métricas generales
- Usar `/api/v1/statistics/stores/by-status` para distribución por estado

### **Página de Productos:**
- Usar `/api/v1/statistics/products` para métricas generales
- Usar `/api/v1/statistics/products/by-category` para distribución por categorías

---

## 🔄 **Actualización de Datos**

### **Frecuencia Recomendada:**
- **Dashboard principal:** Cada 30 segundos - 1 minuto
- **Páginas específicas:** Al cargar la página
- **Datos críticos:** En tiempo real (WebSocket futuro)

### **Implementación de Refresh:**
```typescript
const useAutoRefresh = (callback: () => void, interval: number) => {
  useEffect(() => {
    const timer = setInterval(callback, interval);
    return () => clearInterval(timer);
  }, [callback, interval]);
};

// Uso en componente
useAutoRefresh(() => {
  fetchStatistics();
}, 30000); // Refresh cada 30 segundos
```

---

## 📊 **Tipos TypeScript Completos**

```typescript
// Interfaces para todas las respuestas
export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  pendingVerification: number;
  suspended: number;
  deleted: number;
}

export interface StoreStatistics {
  total: number;
  verified: number;
  pendingVerification: number;
  suspended: number;
  deleted: number;
}

export interface ProductStatistics {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export interface SystemStatistics {
  users: UserStatistics;
  stores: StoreStatistics;
  products: ProductStatistics;
  lastUpdated: string;
}

export interface RoleStatistics {
  [key: string]: number;
}

export interface CategoryStatistics {
  [key: string]: number;
}

export interface StatusStatistics {
  verified: number;
  pending: number;
  suspended: number;
}
```

---

## 🎯 **Próximos Pasos para Frontend**

1. **Implementar autenticación** con JWT tokens
2. **Crear hooks personalizados** para cada endpoint
3. **Implementar manejo de errores** robusto
4. **Crear componentes de dashboard** reutilizables
5. **Implementar auto-refresh** para datos en tiempo real
6. **Agregar loading states** y skeleton loaders
7. **Implementar cache local** para optimizar performance

---

## 📞 **Soporte Técnico**

Si encuentras problemas:

1. **Verifica autenticación** - Token JWT válido
2. **Confirma permisos** - Usuario debe ser admin o super_admin
3. **Revisa logs** del backend para errores
4. **Contacta al equipo** de backend si persisten los problemas

---

**✅ Los endpoints están IMPLEMENTADOS y DISPONIBLES**  
**🚀 Listos para usar en producción**  
**📱 Optimizados para dashboards y aplicaciones móviles**

---

*Documento creado para el equipo de Frontend*  
*Última actualización: 2025-08-29*  
*Versión: 1.0*
