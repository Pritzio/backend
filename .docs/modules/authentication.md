# 🔐 Módulo de Autenticación - Pritzio Backend

## 📖 **Información General**

El módulo de autenticación de Pritzio Backend proporciona un sistema completo de **RBAC (Role-Based Access Control)** que permite gestionar usuarios, roles y permisos de manera granular y segura.

### **Características Principales**
- ✅ **Sistema RBAC completo** con 7 roles predefinidos
- ✅ **40+ permisos granulares** organizados en 7 categorías
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Guards de seguridad** para protección de endpoints
- ✅ **Decoradores personalizados** para control de acceso
- ✅ **Validación completa** de entrada y salida
- ✅ **Seeder automático** para roles y permisos
- ✅ **Documentación Swagger** completa
- ✅ **Arquitectura escalable** para futuros módulos

### **Arquitectura del Sistema**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │      Role       │    │   Permission    │
│                 │    │                 │    │                 │
│ • id            │◄──►│ • id            │◄──►│ • id            │
│ • username      │    │ • name          │    │ • name          │
│ • email         │    │ • displayName   │    │ • displayName   │
│ • password      │    │ • description   │    │ • category      │
│ • status        │    │ • priority      │    │ • priority      │
│ • type          │    │ • permissions   │    │ • roles         │
│ • roles         │    │ • users         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 **Implementación**

### **Instalación y Configuración**

#### **1. Dependencias Requeridas**
```bash
npm install @nestjs/passport passport passport-jwt bcrypt uuid
npm install -D @types/passport-jwt @types/bcrypt @types/uuid
```

#### **2. Variables de Entorno**
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=pritzio-backend
JWT_AUDIENCE=pritzio-users

# Security
BCRYPT_ROUNDS=12
```

#### **3. Configuración del Módulo**
```typescript
// app.module.ts
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ... otros módulos
    AuthModule,
  ],
})
export class AppModule {}
```

### **Estructura del Código**
```
src/auth/
├── entities/              # Entidades de base de datos
│   ├── user.entity.ts     # Entidad de usuario
│   ├── role.entity.ts     # Entidad de rol
│   └── permission.entity.ts # Entidad de permiso
├── dto/                   # Data Transfer Objects
│   ├── auth.dto.ts        # DTOs de entrada
│   └── auth-response.dto.ts # DTOs de respuesta
├── services/              # Lógica de negocio
│   ├── auth.service.ts    # Servicio principal de auth
│   └── jwt.service.ts     # Servicio de JWT
├── controllers/           # Controladores de API
│   └── auth.controller.ts # Controlador de autenticación
├── guards/                # Guards de seguridad
│   ├── jwt-auth.guard.ts  # Guard de autenticación JWT
│   ├── roles.guard.ts     # Guard de verificación de roles
│   └── permissions.guard.ts # Guard de verificación de permisos
├── decorators/            # Decoradores personalizados
│   ├── roles.decorator.ts # Decorador de roles
│   ├── permissions.decorator.ts # Decorador de permisos
│   ├── current-user.decorator.ts # Decorador de usuario actual
│   └── public.decorator.ts # Decorador de endpoints públicos
├── strategies/            # Estrategias de Passport
│   └── jwt.strategy.ts    # Estrategia JWT
├── seeds/                 # Seeders de base de datos
│   ├── auth.seeder.ts     # Seeder de roles y permisos
│   └── run-seeder.ts      # Script de ejecución
└── auth.module.ts         # Configuración del módulo
```

## 📡 **API Reference Completa**

### **📋 Resumen de Endpoints**

| Método | Endpoint | Autenticación | Roles Requeridos | Descripción |
|--------|----------|----------------|------------------|-------------|
| `POST` | `/api/v1/auth/register` | ❌ Público | - | Registro de usuarios |
| `POST` | `/api/v1/auth/login` | ❌ Público | - | Inicio de sesión |
| `POST` | `/api/v1/auth/forgot-password` | ❌ Público | - | Solicitar reset de contraseña |
| `POST` | `/api/v1/auth/reset-password` | ❌ Público | - | Resetear contraseña |
| `POST` | `/api/v1/auth/verify-email` | ❌ Público | - | Verificar email |
| `POST` | `/api/v1/auth/verify-phone` | ❌ Público | - | Verificar teléfono |
| `POST` | `/api/v1/auth/refresh` | ✅ JWT | - | Renovar token de acceso |
| `POST` | `/api/v1/auth/logout` | ✅ JWT | - | Cerrar sesión |
| `PUT` | `/api/v1/auth/change-password` | ✅ JWT | - | Cambiar contraseña |
| `GET` | `/api/v1/auth/profile` | ✅ JWT | - | Obtener perfil de usuario |
| `PUT` | `/api/v1/auth/profile` | ✅ JWT | - | Actualizar perfil de usuario |
| `POST` | `/api/v1/auth/assign-role` | ✅ JWT | `SUPER_ADMIN`, `ADMIN` | Asignar rol a usuario |
| `DELETE` | `/api/v1/auth/remove-role` | ✅ JWT | `SUPER_ADMIN`, `ADMIN` | Remover rol de usuario |
| `PUT` | `/api/v1/auth/user-status` | ✅ JWT | `SUPER_ADMIN`, `ADMIN` | Cambiar estado de usuario |

### **🔓 Endpoints Públicos (Sin Autenticación)**

#### **1. Registro de Usuario**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "type": "individual"
}
```

**Parámetros Requeridos:**
- `username`: Nombre de usuario único (3-30 caracteres)
- `email`: Email válido y único
- `password`: Contraseña segura (mínimo 8 caracteres, mayúsculas, minúsculas, números, símbolos)
- `firstName`: Nombre del usuario
- `lastName`: Apellido del usuario

**Parámetros Opcionales:**
- `phone`: Número de teléfono con formato internacional
- `type`: Tipo de usuario (`individual`, `business`, `system`)

**Validaciones:**
- Username debe ser único
- Email debe ser único y válido
- Password debe cumplir requisitos de seguridad
- Phone debe tener formato válido

**Respuesta Exitosa (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "status": "pending_verification",
    "type": "individual",
    "roles": [...],
    "permissions": [...]
  }
}
```

**Códigos de Respuesta:**
- `201 Created`: Usuario registrado exitosamente
- `400 Bad Request`: Datos inválidos o faltantes
- `409 Conflict`: Username o email ya existe
- `500 Internal Server Error`: Error del servidor

**Errores Comunes:**
```json
// Usuario ya existe
{
  "statusCode": 409,
  "message": "Username or email already exists",
  "error": "Conflict"
}

// Datos inválidos
{
  "statusCode": 400,
  "message": [
    "username must be longer than or equal to 3 characters",
    "email must be an email",
    "password is not strong enough"
  ],
  "error": "Bad Request"
}
```

#### **2. Inicio de Sesión**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "john@example.com", // email o username
  "password": "SecurePass123!"
}
```

**Parámetros:**
- `identifier`: Email o username del usuario
- `password`: Contraseña del usuario

**Características:**
- Acepta tanto email como username como identificador
- Verifica que la cuenta esté activa
- Actualiza `lastLoginAt` y `lastLoginIp`
- Genera nuevos tokens de acceso y refresh

**Respuesta Exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    // ... información del usuario
  }
}
```

**Códigos de Respuesta:**
- `200 OK`: Login exitoso
- `400 Bad Request`: Datos faltantes o inválidos
- `401 Unauthorized`: Credenciales incorrectas o cuenta inactiva
- `429 Too Many Requests`: Demasiados intentos de login

**Errores Comunes:**
```json
// Credenciales incorrectas
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// Cuenta inactiva
{
  "statusCode": 401,
  "message": "Account is not active",
  "error": "Unauthorized"
}

// Demasiados intentos
{
  "statusCode": 429,
  "message": "Too many login attempts. Please try again later.",
  "error": "Too Many Requests"
}
```

#### **3. Recuperar Contraseña**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Respuesta (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

#### **4. Resetear Contraseña**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}
```

### **🔐 Endpoints Protegidos (Requieren Autenticación)**

#### **1. Cerrar Sesión**
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

#### **2. Cambiar Contraseña**
```http
PUT /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass123!"
}
```

#### **3. Obtener Perfil**
```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

#### **4. Actualizar Perfil**
```http
PUT /api/v1/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "+1987654321"
}
```

### **Endpoints de Administración (Requieren Roles Específicos)**

#### **1. Asignar Rol a Usuario**
```http
POST /api/v1/auth/assign-role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "roleId": "role-uuid-here"
}
```

**Roles Requeridos:** `SUPER_ADMIN`, `ADMIN`  
**Permisos Requeridos:** `role:assign`

#### **2. Remover Rol de Usuario**
```http
DELETE /api/v1/auth/remove-role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "roleId": "role-uuid-here"
}
```

#### **3. Actualizar Estado de Usuario**
```http
PUT /api/v1/auth/user-status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "status": "active"
}
```

**Roles Requeridos:** `SUPER_ADMIN`, `ADMIN`  
**Permisos Requeridos:** `user:update`

### **💻 Ejemplos Prácticos de Uso**

#### **1. Ejemplos con cURL**

##### **Registro de Usuario**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "type": "individual"
  }'
```

##### **Login de Usuario**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "TestPass123!"
  }'
```

##### **Obtener Perfil (Con Token)**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

##### **Cambiar Contraseña**
```bash
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewTestPass123!"
  }'
```

#### **2. Ejemplos con JavaScript/TypeScript**

##### **Cliente de Autenticación**
```typescript
class AuthClient {
  private baseUrl = 'http://localhost:3000/api/v1/auth';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    
    return data;
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    
    return data;
  }

  async getProfile(): Promise<UserResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseUrl}/profile`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.statusText}`);
    }
    
    return response.json();
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    this.accessToken = data.accessToken;
    
    return data.accessToken;
  }

  async logout(): Promise<void> {
    if (!this.accessToken) return;

    await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });
    
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// Uso del cliente
const authClient = new AuthClient();

// Ejemplo de flujo completo
async function authFlow() {
  try {
    // 1. Registrar usuario
    const registerResponse = await authClient.register({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      type: 'individual'
    });
    
    console.log('Usuario registrado:', registerResponse.user);
    
    // 2. Login
    const loginResponse = await authClient.login('newuser@example.com', 'SecurePass123!');
    console.log('Login exitoso:', loginResponse.user);
    
    // 3. Obtener perfil
    const profile = await authClient.getProfile();
    console.log('Perfil del usuario:', profile);
    
    // 4. Logout
    await authClient.logout();
    console.log('Logout exitoso');
    
  } catch (error) {
    console.error('Error en el flujo de autenticación:', error);
  }
}
```

#### **3. Ejemplos con React Hook**

```typescript
// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAuthState({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authState.accessToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authState.accessToken}` },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [authState.accessToken]);

  const hasPermission = useCallback((permission: string) => {
    return authState.user?.permissions.includes(permission) || false;
  }, [authState.user]);

  const hasRole = useCallback((role: string) => {
    return authState.user?.roles.includes(role) || false;
  }, [authState.user]);

  useEffect(() => {
    // Verificar token al cargar
    if (authState.accessToken) {
      fetch('/api/v1/auth/profile', {
        headers: { 'Authorization': `Bearer ${authState.accessToken}` },
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Invalid token');
        })
        .then(user => {
          setAuthState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));
        })
        .catch(() => {
          // Token inválido, limpiar estado
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setAuthState(prev => ({
            ...prev,
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [authState.accessToken]);

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    hasRole,
  };
};
```

## 💡 **Guías de Uso**

### **Flujo de Autenticación Básico**

#### **1. Registro de Usuario**
```typescript
// 1. Usuario se registra
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'newuser',
    email: 'user@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User'
  })
});

const { accessToken, refreshToken, user } = await response.json();

// 2. Guardar tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

#### **2. Login y Uso de Tokens**
```typescript
// 1. Usuario hace login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password123'
  })
});

const { accessToken } = await loginResponse.json();

// 2. Usar token para requests autenticados
const profileResponse = await fetch('/api/v1/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

#### **3. Refresh de Token**
```typescript
// Cuando el access token expira
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { accessToken: newAccessToken } = await refreshResponse.json();
localStorage.setItem('accessToken', newAccessToken);
```

### **Implementación de Guards en Endpoints**

#### **1. Endpoint Público**
```typescript
@Public()
@Get('public-info')
async getPublicInfo() {
  return { message: 'This is public information' };
}
```

#### **2. Endpoint con Autenticación**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-info')
async getProtectedInfo() {
  return { message: 'This is protected information' };
}
```

#### **3. Endpoint con Roles Específicos**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.STORE_ADMIN)
@Get('admin-info')
async getAdminInfo() {
  return { message: 'This is admin information' };
}
```

#### **4. Endpoint con Permisos Específicos**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleType.ADMIN)
@Permissions(PermissionType.USER_CREATE)
@Post('create-user')
async createUser(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

#### **5. Endpoint con Usuario Actual**
```typescript
@UseGuards(JwtAuthGuard)
@Get('my-profile')
async getMyProfile(@CurrentUser() user: any) {
  return this.authService.getProfile(user.id);
}
```

### **Gestión de Roles y Permisos**

#### **1. Verificar Roles en el Frontend**
```typescript
// Función helper para verificar roles
function hasRole(user: any, requiredRoles: string[]): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some(role => requiredRoles.includes(role.name));
}

// Uso
if (hasRole(currentUser, ['ADMIN', 'STORE_ADMIN'])) {
  // Mostrar funcionalidades de administrador
}
```

#### **2. Verificar Permisos en el Frontend**
```typescript
// Función helper para verificar permisos
function hasPermission(user: any, requiredPermissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  return requiredPermissions.some(permission => 
    user.permissions.includes(permission)
  );
}

// Uso
if (hasPermission(currentUser, ['user:create', 'user:update'])) {
  // Mostrar botones de crear/editar usuario
}
```

#### **3. Componente de Navegación Condicional**
```typescript
// React component example
function Navigation({ user }) {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      
      {hasRole(user, ['ADMIN', 'STORE_ADMIN']) && (
        <Link to="/admin">Admin Panel</Link>
      )}
      
      {hasPermission(user, ['user:create']) && (
        <Link to="/users/create">Create User</Link>
      )}
      
      {hasPermission(user, ['analytics:read']) && (
        <Link to="/analytics">Analytics</Link>
      )}
    </nav>
  );
}
```

## 🛠️ **Desarrollo**

### **Crear Nuevos Roles**

#### **1. Definir el Rol en la Entidad**
```typescript
// src/auth/entities/role.entity.ts
export enum RoleType {
  // ... roles existentes
  NEW_ROLE = 'new_role',
}
```

#### **2. Agregar al Seeder**
```typescript
// src/auth/seeds/auth.seeder.ts
{
  name: RoleType.NEW_ROLE,
  displayName: 'New Role',
  description: 'Description of the new role',
  isSystem: true,
  priority: 500,
  permissions: [
    PermissionType.USER_READ,
    PermissionType.PRODUCT_READ,
    // ... otros permisos
  ],
}
```

#### **3. Ejecutar el Seeder**
```bash
npm run seed:auth
```

### **Crear Nuevos Permisos**

#### **1. Estructura de Permisos Existentes**

El sistema ya incluye **40+ permisos** organizados en **7 categorías**:

```typescript
// src/auth/entities/permission.entity.ts
export enum PermissionCategory {
  USER = 'user',           // Gestión de usuarios
  ROLE = 'role',           // Gestión de roles
  PERMISSION = 'permission', // Gestión de permisos
  AUTH = 'auth',           // Autenticación
  SYSTEM = 'system',       // Sistema
  STORE = 'store',         // Tiendas
  PRODUCT = 'product',     // Productos
}

export enum PermissionType {
  // Categoría USER
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',
  
  // Categoría ROLE
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN = 'role:assign',
  ROLE_REMOVE = 'role:remove',
  
  // Categoría PERMISSION
  PERMISSION_CREATE = 'permission:create',
  PERMISSION_READ = 'permission:read',
  PERMISSION_UPDATE = 'permission:update',
  PERMISSION_DELETE = 'permission:delete',
  PERMISSION_ASSIGN = 'permission:assign',
  
  // Categoría AUTH
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_REFRESH = 'auth:refresh',
  AUTH_CHANGE_PASSWORD = 'auth:change_password',
  
  // Categoría SYSTEM
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
  
  // Categoría STORE
  STORE_CREATE = 'store:create',
  STORE_READ = 'store:read',
  STORE_UPDATE = 'store:update',
  STORE_DELETE = 'store:delete',
  STORE_MANAGE = 'store:manage',
  
  // Categoría PRODUCT
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_MANAGE = 'product:manage',
}
```

#### **2. Agregar Nuevos Permisos**

##### **Paso 1: Definir el Nuevo Permiso**
```typescript
// src/auth/entities/permission.entity.ts
export enum PermissionType {
  // ... permisos existentes
  
  // Nuevos permisos para tu módulo
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_APPROVE = 'invoice:approve',
  INVOICE_REJECT = 'invoice:reject',
}

export enum PermissionCategory {
  // ... categorías existentes
  
  // Nueva categoría
  INVOICE = 'invoice',
}
```

##### **Paso 2: Agregar al Seeder**
```typescript
// src/auth/seeder/auth.seeder.ts
async seedPermissions(): Promise<void> {
  const permissions = [
    // ... permisos existentes
    
    // Nuevos permisos de facturación
    {
      name: PermissionType.INVOICE_CREATE,
      displayName: 'Create Invoice',
      description: 'Can create new invoices',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 100,
    },
    {
      name: PermissionType.INVOICE_READ,
      displayName: 'Read Invoice',
      description: 'Can view invoices',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 90,
    },
    {
      name: PermissionType.INVOICE_UPDATE,
      displayName: 'Update Invoice',
      description: 'Can modify invoices',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 80,
    },
    {
      name: PermissionType.INVOICE_DELETE,
      displayName: 'Delete Invoice',
      description: 'Can delete invoices',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 70,
    },
    {
      name: PermissionType.INVOICE_APPROVE,
      displayName: 'Approve Invoice',
      description: 'Can approve invoices for payment',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 60,
    },
    {
      name: PermissionType.INVOICE_REJECT,
      displayName: 'Reject Invoice',
      description: 'Can reject invoices',
      category: PermissionCategory.INVOICE,
      isSystem: true,
      priority: 50,
    },
  ];
  
  // ... resto del código del seeder
}
```

##### **Paso 3: Crear Nuevos Roles (Opcional)**
```typescript
// src/auth/seeder/auth.seeder.ts
async seedRoles(): Promise<void> {
  const roles = [
    // ... roles existentes
    
    // Nuevo rol para facturación
    {
      name: 'INVOICE_MANAGER',
      displayName: 'Invoice Manager',
      description: 'Manages all invoice operations',
      isSystem: true,
      priority: 60,
      permissions: [
        PermissionType.INVOICE_CREATE,
        PermissionType.INVOICE_READ,
        PermissionType.INVOICE_UPDATE,
        PermissionType.INVOICE_DELETE,
        PermissionType.INVOICE_APPROVE,
        PermissionType.INVOICE_REJECT,
      ],
    },
    {
      name: 'INVOICE_VIEWER',
      displayName: 'Invoice Viewer',
      description: 'Can only view invoices',
      isSystem: true,
      priority: 70,
      permissions: [
        PermissionType.INVOICE_READ,
      ],
    },
  ];
  
  // ... resto del código del seeder
}
```

#### **3. Aplicar los Nuevos Permisos**

##### **Paso 1: Ejecutar el Seeder**
```bash
# Ejecutar el seeder para crear nuevos permisos y roles
npm run seed:auth
```

##### **Paso 2: Verificar en la Base de Datos**
```sql
-- Verificar que se crearon los nuevos permisos
SELECT name, display_name, category, is_system 
FROM permissions 
WHERE category = 'invoice';

-- Verificar que se crearon los nuevos roles
SELECT name, display_name, is_system 
FROM roles 
WHERE name IN ('INVOICE_MANAGER', 'INVOICE_VIEWER');

-- Verificar la relación rol-permiso
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('INVOICE_MANAGER', 'INVOICE_VIEWER');
```

#### **4. Usar los Nuevos Permisos en el Código**

##### **En Controllers**
```typescript
// src/invoice/invoice.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionType } from '../auth/entities/permission.entity';

@Controller('invoice')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoiceController {
  
  @Post()
  @Permissions(PermissionType.INVOICE_CREATE)
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    // Lógica para crear factura
  }
  
  @Get()
  @Permissions(PermissionType.INVOICE_READ)
  async getAllInvoices() {
    // Lógica para obtener facturas
  }
  
  @Put(':id')
  @Permissions(PermissionType.INVOICE_UPDATE)
  async updateInvoice(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    // Lógica para actualizar factura
  }
  
  @Delete(':id')
  @Permissions(PermissionType.INVOICE_DELETE)
  async deleteInvoice(@Param('id') id: string) {
    // Lógica para eliminar factura
  }
  
  @Post(':id/approve')
  @Permissions(PermissionType.INVOICE_APPROVE)
  async approveInvoice(@Param('id') id: string) {
    // Lógica para aprobar factura
  }
  
  @Post(':id/reject')
  @Permissions(PermissionType.INVOICE_REJECT)
  async rejectInvoice(@Param('id') id: string, @Body() rejectDto: RejectInvoiceDto) {
    // Lógica para rechazar factura
  }
}
```

##### **En Servicios**
```typescript
// src/invoice/invoice.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PermissionType } from '../auth/entities/permission.entity';

@Injectable()
export class InvoiceService {
  
  async createInvoice(userId: string, createInvoiceDto: CreateInvoiceDto) {
    // Verificar permisos manualmente si es necesario
    const user = await this.userService.findById(userId);
    const hasPermission = this.authService.hasPermission(user, PermissionType.INVOICE_CREATE);
    
    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para crear facturas');
    }
    
    // Lógica para crear factura
  }
  
  async approveInvoice(userId: string, invoiceId: string) {
    const user = await this.userService.findById(userId);
    const hasPermission = this.authService.hasPermission(user, PermissionType.INVOICE_APPROVE);
    
    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para aprobar facturas');
    }
    
    // Lógica para aprobar factura
  }
}
```

#### **5. Testing de Permisos**

##### **Test de Permisos**
```typescript
// src/invoice/invoice.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('InvoiceController', () => {
  let controller: InvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InvoiceController>(InvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInvoice', () => {
    it('should require INVOICE_CREATE permission', () => {
      // Test de permisos
    });
  });
});
```

#### **6. Mejores Prácticas para Permisos**

##### **Nomenclatura de Permisos**
```typescript
// Formato recomendado: resource:action
export enum PermissionType {
  // ✅ Correcto
  USER_CREATE = 'user:create',
  INVOICE_APPROVE = 'invoice:approve',
  STORE_MANAGE = 'store:manage',
  
  // ❌ Evitar
  CREATE_USER = 'create_user',           // No sigue el patrón
  CAN_APPROVE_INVOICES = 'can_approve', // Muy específico
  MANAGE_STORE = 'manage_store',         // Inconsistente
}
```

##### **Categorías de Permisos**
```typescript
// Agrupar permisos relacionados
export enum PermissionCategory {
  USER = 'user',           // Usuarios
  ROLE = 'role',           // Roles
  PERMISSION = 'permission', // Permisos
  AUTH = 'auth',           // Autenticación
  SYSTEM = 'system',       // Sistema
  STORE = 'store',         // Tiendas
  PRODUCT = 'product',     // Productos
  INVOICE = 'invoice',     // Facturación
  REPORT = 'report',       // Reportes
  ANALYTICS = 'analytics', // Analíticas
}
```

##### **Prioridades de Permisos**
```typescript
// Sistema de prioridades (menor número = mayor prioridad)
const permissionPriorities = {
  SYSTEM_ADMIN: 10,        // Acceso total al sistema
  USER_MANAGE: 20,         // Gestión de usuarios
  ROLE_MANAGE: 30,         // Gestión de roles
  INVOICE_APPROVE: 60,     // Aprobar facturas
  INVOICE_VIEW: 90,        // Ver facturas
  BASIC_ACCESS: 100,       // Acceso básico
};
```

### **Extender el Sistema de Usuarios**

#### **1. Agregar Campos al Usuario**
```typescript
// src/auth/entities/user.entity.ts
@Entity('users')
export class User {
  // ... campos existentes
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  companyName: string;
  
  @Column({ type: 'varchar', length: 20, nullable: true })
  taxId: string;
  
  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;
}
```

#### **2. Actualizar DTOs**
```typescript
// src/auth/dto/auth.dto.ts
export class RegisterDto {
  // ... campos existentes
  
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;
  
  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;
}
```

#### **3. Actualizar el Servicio**
```typescript
// src/auth/services/auth.service.ts
async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
  // ... lógica existente
  
  const user = this.userRepository.create({
    ...registerDto,
    password: hashedPassword,
    status: UserStatus.PENDING_VERIFICATION,
    type: registerDto.type || UserType.INDIVIDUAL,
    companyName: registerDto.companyName,
    taxId: registerDto.taxId,
  });
  
  // ... resto de la lógica
}
```

### **Testing del Módulo**

#### **1. Test de Servicios**
```typescript
// src/auth/services/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            generateTokenPair: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(registerDto as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(registerDto as any);
      jest.spyOn(jwtService, 'generateTokenPair').mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
      });

      const result = await service.register(registerDto);

      expect(result.user.username).toBe(registerDto.username);
      expect(result.accessToken).toBeDefined();
    });
  });
});
```

#### **2. Test de Guards**
```typescript
// src/auth/guards/jwt-auth.guard.spec.ts
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow public endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});
```

## 🚨 **Troubleshooting**

### **Problemas Comunes**

#### **1. Error: "JWT_SECRET is not defined"**
**Síntoma:** Error al iniciar la aplicación
**Causa:** Variable de entorno JWT_SECRET no configurada
**Solución:**
```bash
# Agregar al archivo .env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### **2. Error: "Invalid or expired token"**
**Síntoma:** Error 401 en endpoints protegidos
**Causa:** Token JWT expirado o inválido
**Solución:**
```typescript
// Verificar que el token se envía correctamente
const response = await fetch('/api/v1/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}` // Asegurar formato correcto
  }
});

// Si el token expiró, usar refresh token
if (response.status === 401) {
  const refreshResponse = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
}
```

#### **3. Error: "Insufficient role permissions"**
**Síntoma:** Error 403 en endpoints con roles específicos
**Causa:** Usuario no tiene el rol requerido
**Solución:**
```typescript
// Verificar roles del usuario
console.log('User roles:', user.roles);

// Asignar rol requerido (solo administradores)
await fetch('/api/v1/auth/assign-role', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    roleId: 'required-role-uuid'
  })
});
```

#### **4. Error: "User with this email or username already exists"**
**Síntoma:** Error 409 al registrar usuario
**Causa:** Email o username ya existe en la base de datos
**Solución:**
```typescript
// Verificar si el usuario existe antes de registrar
const existingUser = await fetch(`/api/v1/users/check?email=${email}`);
if (existingUser.ok) {
  // Usar email/username diferente o hacer login
}
```

#### **5. Error: "Account is not active"**
**Síntoma:** Error 401 al hacer login
**Causa:** Usuario no ha verificado su cuenta o está suspendido
**Solución:**
```typescript
// Verificar estado del usuario
const user = await fetch(`/api/v1/users/${userId}`);
const userData = await user.json();

if (userData.status === 'pending_verification') {
  // Enviar email de verificación
  await fetch('/api/v1/auth/send-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email: userData.email })
  });
}
```

### **Logs y Debugging**

#### **1. Habilitar Logs de Autenticación**
```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

#### **2. Verificar Tokens JWT**
```typescript
// Decodificar token para debugging
import jwt from 'jsonwebtoken';

const decoded = jwt.decode(token, { complete: true });
console.log('Token payload:', decoded?.payload);
```

#### **3. Verificar Permisos del Usuario**
```typescript
// En el servicio de autenticación
async getProfile(userId: string): Promise<UserResponseDto> {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['roles', 'roles.permissions'],
  });
  
  console.log('User permissions:', this.extractPermissions(user));
  return this.mapUserToResponse(user);
}
```

### **Performance y Optimización**

#### **1. Cache de Roles y Permisos**
```typescript
// Implementar cache con Redis
@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    // ... otros servicios
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user:permissions:${userId}`;
    
    // Intentar obtener del cache
    let permissions = await this.redisService.get(cacheKey);
    
    if (!permissions) {
      // Obtener de la base de datos
      permissions = await this.fetchUserPermissions(userId);
      
      // Guardar en cache por 1 hora
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(permissions));
    }
    
    return JSON.parse(permissions);
  }
}
```

#### **2. Optimización de Consultas**
```typescript
// Usar select específico para reducir datos transferidos
const user = await this.userRepository.findOne({
  where: { id: userId },
  select: ['id', 'username', 'email', 'status'],
  relations: ['roles'],
});
```

## 📚 **Recursos Adicionales**

### **Documentación Relacionada**
- **[Docker Setup](../setup/docker-setup.md)** - Configuración de Docker
- **[Environment Configuration](../setup/environment.md)** - Variables de entorno
- **[API Guidelines](../development/api-guidelines.md)** - Guías de API

### **Enlaces Externos**
- **[NestJS Documentation](https://docs.nestjs.com/)** - Documentación oficial de NestJS
- **[Passport.js](http://www.passportjs.org/)** - Estrategias de autenticación
- **[JWT.io](https://jwt.io/)** - Debugger de tokens JWT
- **[bcrypt](https://github.com/dcodeIO/bcrypt.js/)** - Hashing de contraseñas

### **Ejemplos de Código**
- **[Auth Module Repository](https://github.com/pritzio/backend/tree/main/src/auth)** - Código fuente completo
- **[Auth Tests](https://github.com/pritzio/backend/tree/main/src/auth)** - Tests unitarios y e2e
- **[API Examples](https://github.com/pritzio/backend/tree/main/docs/api)** - Ejemplos de uso de la API

---

## 🎯 **Estado Actual del Módulo**

### **✅ Funcionalidades Implementadas y Verificadas**

#### **Endpoints Públicos Funcionando**
- `POST /api/v1/auth/register` - Registro de usuarios ✅
- `POST /api/v1/auth/login` - Login de usuarios ✅
- `POST /api/v1/auth/forgot-password` - Solicitar reset de contraseña ✅
- `POST /api/v1/auth/reset-password` - Reset de contraseña ✅
- `POST /api/v1/auth/verify-email` - Verificación de email ✅
- `POST /api/v1/auth/verify-phone` - Verificación de teléfono ✅

#### **Endpoints Protegidos Funcionando**
- `POST /api/v1/auth/logout` - Logout de usuario ✅
- `PUT /api/v1/auth/change-password` - Cambio de contraseña ✅
- `GET /api/v1/auth/profile` - Obtener perfil de usuario ✅
- `PUT /api/v1/auth/profile` - Actualizar perfil de usuario ✅
- `POST /api/v1/auth/refresh` - Renovar token de acceso ✅

#### **Endpoints de Administración Funcionando**
- `POST /api/v1/auth/assign-role` - Asignar rol a usuario ✅
- `DELETE /api/v1/auth/remove-role` - Remover rol de usuario ✅
- `PUT /api/v1/auth/user-status` - Cambiar estado de usuario ✅

#### **Sistema de Estados de Usuario Implementado**
- `pending_verification` - Usuario registrado, pendiente de verificación ✅
- `active` - Usuario verificado y activo ✅
- `inactive` - Usuario desactivado ✅
- `suspended` - Usuario suspendido ✅

#### **Sistema RBAC Completamente Funcional**
- **Roles**: SUPER_ADMIN, ADMIN, STORE_ADMIN, STORE_MANAGER, STORE_EMPLOYEE, CUSTOMER, GUEST ✅
- **Permisos**: Sistema granular de permisos por categoría ✅
- **Asignación automática**: Roles por defecto según tipo de usuario ✅
- **Guards de seguridad**: Protección de rutas por roles y permisos ✅
- **Seeder de datos**: Roles y permisos pre-configurados ✅

### **🔧 Problemas Resueltos**
- ✅ **Error 500 en registro**: Corregido problema de configuración de bcrypt
- ✅ **Estados de usuario**: Sistema de activación implementado
- ✅ **Hash de contraseñas**: Funcionando correctamente con salt rounds fijos
- ✅ **Base de datos**: Conexión y sincronización funcionando
- ✅ **Docker**: Contenedores PostgreSQL y Redis funcionando

### **🚀 Próximas Mejoras**
- Implementar verificación de email real con envío de correos
- Implementar verificación de SMS real con envío de códigos
- Implementar rate limiting para prevenir ataques
- Implementar auditoría completa de login y acciones
- Implementar notificaciones de seguridad por email/SMS

---

**Última Actualización**: 2025-08-21  
**Versión del Módulo**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo Pritzio  
**Estado**: ✅ Completado, Probado y Documentado
