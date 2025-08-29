# API de Estadísticas - Pritzio Backend

## 📊 Descripción General

Los endpoints de estadísticas proporcionan información consolidada sobre el estado del sistema, incluyendo conteos de usuarios, tiendas y productos. Estos endpoints están diseñados para dashboards administrativos y reportes.

## 🔐 Requisitos de Acceso

- **Autenticación**: Token JWT válido
- **Roles Permitidos**: `admin`, `super_admin`
- **Permisos**: `analytics:read`, `store:read`, `product:read`

## 📋 Endpoints Disponibles

### **1. Estadísticas de Usuarios**

**Endpoint:** `GET /api/v1/statistics/users`

**Descripción:** Obtiene estadísticas completas de usuarios del sistema.

**Respuesta:**
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

**Campos de la Respuesta:**
- `total`: Número total de usuarios registrados
- `active`: Usuarios con estado activo
- `inactive`: Usuarios con estado inactivo
- `pendingVerification`: Usuarios pendientes de verificación de email
- `suspended`: Usuarios suspendidos
- `deleted`: Usuarios eliminados (soft delete)

---

### **2. Estadísticas de Tiendas**

**Endpoint:** `GET /api/v1/statistics/stores`

**Descripción:** Obtiene estadísticas completas de tiendas en la plataforma.

**Respuesta:**
```json
{
  "total": 45,
  "verified": 38,
  "pendingVerification": 5,
  "suspended": 2,
  "deleted": 0
}
```

**Campos de la Respuesta:**
- `total`: Número total de tiendas registradas
- `verified`: Tiendas verificadas y activas
- `pendingVerification`: Tiendas pendientes de verificación
- `suspended`: Tiendas suspendidas
- `deleted`: Tiendas eliminadas

---

### **3. Estadísticas de Productos**

**Endpoint:** `GET /api/v1/statistics/products`

**Descripción:** Obtiene estadísticas completas de productos en el catálogo.

**Respuesta:**
```json
{
  "total": 1250,
  "active": 1180,
  "inactive": 70,
  "deleted": 0
}
```

**Campos de la Respuesta:**
- `total`: Número total de productos en el catálogo
- `active`: Productos activos y disponibles
- `inactive`: Productos inactivos o descontinuados
- `deleted`: Productos eliminados

---

### **4. Estadísticas del Sistema (Consolidado)**

**Endpoint:** `GET /api/v1/statistics/system`

**Descripción:** Obtiene todas las estadísticas del sistema en una sola respuesta.

**Respuesta:**
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

**Campos Adicionales:**
- `lastUpdated`: Timestamp de cuando se generaron las estadísticas

---

### **5. Usuarios por Rol**

**Endpoint:** `GET /api/v1/statistics/users/by-role`

**Descripción:** Obtiene la distribución de usuarios por rol.

**Respuesta:**
```json
{
  "customer": 150,
  "admin": 5,
  "super_admin": 2
}
```

---

### **6. Tiendas por Estado de Verificación**

**Endpoint:** `GET /api/v1/statistics/stores/by-status`

**Descripción:** Obtiene la distribución de tiendas por estado de verificación.

**Respuesta:**
```json
{
  "verified": 38,
  "pending": 5,
  "suspended": 2
}
```

---

### **7. Productos por Categoría**

**Endpoint:** `GET /api/v1/statistics/products/by-category`

**Descripción:** Obtiene la distribución de productos por categoría.

**Respuesta:**
```json
{
  "electronics": 450,
  "clothing": 320,
  "home_and_garden": 280,
  "sports": 200
}
```

## 💡 Ejemplos de Uso

### **Ejemplo con cURL**

```bash
# 1. Obtener token de autenticación
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@pritzio.com",
    "password": "tu_password"
  }'

# 2. Usar el token para obtener estadísticas
curl -X GET http://localhost:3000/api/v1/statistics/system \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **Ejemplo con JavaScript**

```javascript
// Función para obtener estadísticas del sistema
async function getSystemStatistics() {
  try {
    const response = await fetch('/api/v1/statistics/system', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const statistics = await response.json();
    console.log('System Statistics:', statistics);
    return statistics;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

// Uso en una aplicación
getSystemStatistics()
  .then(stats => {
    document.getElementById('totalUsers').textContent = stats.users.total;
    document.getElementById('activeUsers').textContent = stats.users.active;
    document.getElementById('totalStores').textContent = stats.stores.total;
    document.getElementById('verifiedStores').textContent = stats.stores.verified;
  })
  .catch(error => {
    console.error('Failed to load statistics:', error);
  });
```

### **Ejemplo con React**

```jsx
import React, { useState, useEffect } from 'react';

const StatisticsDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('authToken');
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) return <div>Cargando estadísticas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="statistics-dashboard">
      <h2>Dashboard de Estadísticas</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Usuarios</h3>
          <p>Total: {statistics.users.total}</p>
          <p>Activos: {statistics.users.active}</p>
        </div>
        
        <div className="stat-card">
          <h3>Tiendas</h3>
          <p>Total: {statistics.stores.total}</p>
          <p>Verificadas: {statistics.stores.verified}</p>
        </div>
        
        <div className="stat-card">
          <h3>Productos</h3>
          <p>Total: {statistics.products.total}</p>
          <p>Activos: {statistics.products.active}</p>
        </div>
      </div>
      
      <p>Última actualización: {new Date(statistics.lastUpdated).toLocaleString()}</p>
    </div>
  );
};

export default StatisticsDashboard;
```

## 🚨 Manejo de Errores

### **Códigos de Estado HTTP**

- **200 OK**: Estadísticas obtenidas correctamente
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos suficientes
- **500 Internal Server Error**: Error interno del servidor

### **Ejemplos de Respuestas de Error**

**401 Unauthorized:**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**403 Forbidden:**
```json
{
  "message": "Insufficient permissions to access analytics",
  "error": "Forbidden",
  "statusCode": 403
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```

## 📈 Casos de Uso

### **Dashboard Administrativo**
- Mostrar métricas clave del sistema
- Monitorear crecimiento de usuarios y tiendas
- Identificar tendencias de productos

### **Reportes Gerenciales**
- Generar reportes de estado del sistema
- Análisis de distribución por categorías
- Seguimiento de verificaciones pendientes

### **Monitoreo del Sistema**
- Alertas cuando métricas excedan umbrales
- Seguimiento de performance del sistema
- Identificación de problemas operacionales

## 🔄 Frecuencia de Actualización

- **Datos en Tiempo Real**: Las estadísticas reflejan el estado actual de la base de datos
- **Performance**: Consultas optimizadas para respuesta rápida
- **Caching**: Se recomienda implementar cache del lado del cliente para reducir carga

## 🛡️ Consideraciones de Seguridad

- **Tokens JWT**: Asegúrate de que los tokens no hayan expirado
- **HTTPS**: Usa siempre conexiones seguras en producción
- **Rate Limiting**: Respeta los límites de velocidad de la API
- **Permisos**: Verifica que el usuario tenga los permisos correctos

## 📞 Soporte

Si encuentras problemas con los endpoints de estadísticas:

1. Verifica que tienes los permisos correctos
2. Confirma que tu token JWT es válido
3. Revisa la documentación de errores
4. Contacta al equipo de desarrollo si persisten los problemas

---

*Última actualización: 2025-08-29*
*Versión de la API: 1.0*
