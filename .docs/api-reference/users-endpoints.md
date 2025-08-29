# API de Usuarios - Referencia Completa

## 📋 Introducción
Esta documentación describe todos los endpoints disponibles para la gestión de usuarios en la API de Pritzio Backend.

## 🔐 Autenticación
Todos los endpoints requieren un token JWT válido en el header `Authorization: Bearer {token}`.

## 👥 Endpoints de Usuario

### **1. 📝 Perfil del Usuario Autenticado**

#### **GET /api/v1/users/profile**
Obtiene el perfil del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Respuesta Exitosa (200):**
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "active",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": false,
    "isActive": true,
    "profileVisibility": "public"
  },
  "roles": [
    {
      "id": "role-uuid",
      "name": "customer",
      "displayName": "Customer"
    }
  ],
  "createdAt": "2025-08-29T17:37:51.089Z",
  "lastLoginAt": "2025-08-29T17:37:51.089Z"
}
```

#### **PUT /api/v1/users/profile**
Actualiza el perfil del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Nueva biografía del usuario",
  "dateOfBirth": "1990-01-01",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "website": "https://johnsmith.com",
  "gender": "male"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "status": "active",
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "bio": "Nueva biografía del usuario",
    "isVerified": false,
    "isActive": true,
    "profileVisibility": "public"
  }
}
```

#### **DELETE /api/v1/users/profile**
Elimina el perfil del usuario autenticado (eliminación pasiva).

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Usuario ya no necesita la cuenta",
  "feedback": "La aplicación funcionaba bien"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Profile deleted successfully"
}
```

### **2. 🔍 Gestión de Usuarios (Admin)**

#### **GET /api/v1/users**
Obtiene la lista paginada de todos los usuarios (solo administradores).

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20)
- `status` (opcional): Filtrar por estado (active, inactive, pending_verification)
- `role` (opcional): Filtrar por rol (customer, admin, super_admin)

**Ejemplo:**
```http
GET /api/v1/users?page=1&limit=10&status=active&role=customer
```

**Respuesta Exitosa (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "status": "active",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "isVerified": false,
        "isActive": true,
        "profileVisibility": "public"
      },
      "roles": [
        {
          "id": "role-uuid",
          "name": "customer",
          "displayName": "Customer"
        }
      ],
      "createdAt": "2025-08-29T17:37:51.089Z",
      "lastLoginAt": "2025-08-29T17:37:51.089Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### **GET /api/v1/users/{id}**
Obtiene el perfil de un usuario específico por ID (solo administradores).

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
```

**Path Parameters:**
- `id`: UUID del usuario

**Ejemplo:**
```http
GET /api/v1/users/43a7a9ad-1d98-45d1-9fb0-87d1d421a8b0
```

**Respuesta Exitosa (200):**
```json
{
  "id": "43a7a9ad-1d98-45d1-9fb0-87d1d421a8b0",
  "username": "johndoe",
  "email": "john@example.com",
  "status": "active",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": false,
    "isActive": true,
    "profileVisibility": "public"
  },
  "roles": [
    {
      "id": "role-uuid",
      "name": "customer",
      "displayName": "Customer"
    }
  ],
  "createdAt": "2025-08-29T17:37:51.089Z",
  "lastLoginAt": "2025-08-29T17:37:51.089Z"
}
```

#### **PUT /api/v1/users/{id}**
Actualiza el perfil de un usuario específico por ID (solo administradores).

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `id`: UUID del usuario

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Biografía actualizada por admin",
  "status": "active"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": "43a7a9ad-1d98-45d1-9fb0-87d1d421a8b0",
  "username": "johndoe",
  "email": "john@example.com",
  "status": "active",
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "bio": "Biografía actualizada por admin",
    "isVerified": false,
    "isActive": true,
    "profileVisibility": "public"
  }
}
```

#### **DELETE /api/v1/users/{id}**
Elimina un usuario específico por ID (eliminación pasiva, solo administradores).

**Headers:**
```http
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `id`: UUID del usuario

**Body:**
```json
{
  "reason": "Violación de términos de servicio",
  "adminNotes": "Usuario reportado por spam"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "User deleted successfully"
}
```

### **3. 🔎 Búsqueda y Filtros**

#### **GET /api/v1/users/search**
Busca usuarios por nombre o biografía.

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `q` (requerido): Término de búsqueda
- `limit` (opcional): Máximo de resultados (default: 10)

**Ejemplo:**
```http
GET /api/v1/users/search?q=john&limit=5
```

**Respuesta Exitosa (200):**
```json
[
  {
    "id": "user-uuid",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Desarrollador web apasionado"
  }
]
```

### **4. 📊 Estadísticas y Actividad**

#### **GET /api/v1/users/activity**
Obtiene la actividad del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Respuesta Exitosa (200):**
```json
[
  {
    "id": "activity-uuid",
    "activityType": "login",
    "description": "User logged in successfully",
    "isSuccessful": true,
    "created_at": "2025-08-29T17:37:51.089Z"
  }
]
```

#### **GET /api/v1/users/stats**
Obtiene estadísticas del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Respuesta Exitosa (200):**
```json
{
  "totalLogins": 15,
  "lastLogin": "2025-08-29T17:37:51.089Z",
  "accountAge": "30 days",
  "profileCompleteness": 85
}
```

## 🚨 Códigos de Error

### **Errores Comunes**

#### **401 Unauthorized**
```json
{
  "message": "Authentication required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

#### **403 Forbidden**
```json
{
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "statusCode": 403
}
```

#### **404 Not Found**
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

#### **409 Conflict**
```json
{
  "message": "User with this email or username already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

#### **422 Validation Error**
```json
{
  "message": "Validation failed",
  "error": "Unprocessable Entity",
  "statusCode": 422,
  "details": [
    "firstName must not be empty",
    "email must be an email"
  ]
}
```

## 🔐 Roles y Permisos

### **Roles Disponibles**
- **CUSTOMER**: Usuario regular
- **STORE_EMPLOYEE**: Empleado de tienda
- **STORE_MANAGER**: Gerente de tienda
- **STORE_ADMIN**: Administrador de tienda
- **ADMIN**: Administrador del sistema
- **SUPER_ADMIN**: Super administrador

### **Permisos Requeridos**
- **USER_READ**: Leer perfiles de usuario
- **USER_UPDATE**: Actualizar perfiles de usuario
- **USER_DELETE**: Eliminar usuarios
- **USER_LIST**: Listar usuarios

## 📱 Ejemplos de Uso

### **Ejemplo 1: Obtener Perfil del Usuario**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/users/profile
```

### **Ejemplo 2: Actualizar Perfil**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Smith"}' \
  http://localhost:3000/api/v1/users/profile
```

### **Ejemplo 3: Listar Usuarios (Admin)**
```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3000/api/v1/users?page=1&limit=10&status=active"
```

### **Ejemplo 4: Buscar Usuarios**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/v1/users/search?q=john&limit=5"
```

## 🔄 Paginación

### **Estructura de Paginación**
```json
{
  "pagination": {
    "page": 1,        // Página actual
    "limit": 20,      // Elementos por página
    "total": 100,     // Total de elementos
    "pages": 5        // Total de páginas
  }
}
```

### **Parámetros de Paginación**
- **page**: Número de página (comienza en 1)
- **limit**: Elementos por página (máximo 100)
- **status**: Filtrar por estado del usuario
- **role**: Filtrar por rol del usuario

## 📝 Notas Importantes

### **Eliminación Pasiva**
- Los usuarios no se eliminan físicamente de la base de datos
- Se marcan como inactivos o eliminados
- Los datos se mantienen para auditoría y cumplimiento legal

### **Validaciones**
- Todos los campos opcionales pueden ser `null`
- Las fechas deben estar en formato ISO 8601
- Los UUIDs deben ser válidos
- Las contraseñas deben cumplir requisitos de seguridad

### **Rate Limiting**
- Máximo 100 requests por minuto por usuario
- Los administradores tienen límites más altos
- Se aplica por IP y por usuario autenticado

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:
1. **Documentación**: Revisar esta guía completa
2. **Swagger**: `/api/docs` para documentación interactiva
3. **Logs**: Verificar logs de la aplicación
4. **Equipo**: Contactar al equipo de desarrollo

---

*Última actualización: 2025-08-29*
*Versión: 1.0*
*API de Usuarios - Pritzio Backend*
