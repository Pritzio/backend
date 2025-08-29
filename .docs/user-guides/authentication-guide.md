# Guía de Registro y Autenticación - Usuario Final

## 📋 Introducción
Esta guía te explica cómo registrarte en Pritzio, cómo autenticarte y qué sucede automáticamente cuando creas tu cuenta.

## 🚀 Registro de Usuario

### **Endpoint de Registro**
```http
POST /api/v1/auth/register
```

### **Datos Requeridos**
```json
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

### **Campos Obligatorios**
- **username**: Nombre de usuario único (3-50 caracteres)
- **email**: Email válido y único
- **password**: Contraseña segura (mínimo 8 caracteres)
- **firstName**: Nombre del usuario
- **lastName**: Apellido del usuario

### **Campos Opcionales**
- **phone**: Número de teléfono
- **type**: Tipo de usuario (`individual` o `business`)

### **Ejemplo de Registro**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "type": "individual"
  }'
```

## 🎯 ¿Qué Sucede al Registrarte?

### **1. ✅ Usuario Creado**
- Se crea tu cuenta en el sistema
- Se asigna un rol por defecto (`customer`)
- Se genera un ID único para tu cuenta

### **2. ✅ Perfil Automático**
- Se crea automáticamente tu perfil de usuario
- Se incluye tu nombre y apellido
- Se configura como perfil público por defecto

### **3. ✅ Preferencias Configuradas**
- Se configuran preferencias estándar:
  - Idioma: Inglés
  - Moneda: USD
  - Zona horaria: UTC
  - Notificaciones habilitadas

### **4. ✅ Actividad Registrada**
- Se registra tu primera actividad en el sistema
- Se crea un log de auditoría

### **5. ✅ Tokens de Acceso**
- Se generan tokens JWT para autenticación
- Access token (15 minutos)
- Refresh token (7 días)

## 🔐 Respuesta del Registro

### **Respuesta Exitosa (201)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "43a7a9ad-1d98-45d1-9fb0-87d1d421a8b0",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "status": "pending_verification",
    "type": "individual",
    "roles": [
      {
        "id": "role-uuid",
        "name": "customer",
        "displayName": "Customer"
      }
    ],
    "createdAt": "2025-08-29T17:37:51.089Z"
  }
}
```

## 🔑 Inicio de Sesión

### **Endpoint de Login**
```http
POST /api/v1/auth/login
```

### **Datos de Login**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123!"
}
```

### **Identificadores Válidos**
- **Email**: `john@example.com`
- **Username**: `johndoe`

### **Ejemplo de Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## 📱 Uso de Tokens

### **Access Token**
- **Duración**: 15 minutos
- **Uso**: Para todas las operaciones de la API
- **Header**: `Authorization: Bearer {token}`

### **Refresh Token**
- **Duración**: 7 días
- **Uso**: Para renovar el access token
- **Endpoint**: `POST /api/v1/auth/refresh`

### **Ejemplo de Uso**
```bash
# Obtener perfil del usuario
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/users/profile

# Actualizar perfil
curl -X PUT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Smith"}' \
  http://localhost:3000/api/v1/users/profile
```

## 🔄 Renovación de Tokens

### **Endpoint de Refresh**
```http
POST /api/v1/auth/refresh
```

### **Datos de Refresh**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### **Ejemplo de Refresh**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🚪 Cierre de Sesión

### **Endpoint de Logout**
```http
POST /api/v1/auth/logout
```

### **Headers Requeridos**
```http
Authorization: Bearer {access_token}
```

### **Ejemplo de Logout**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔒 Seguridad y Validaciones

### **Requisitos de Contraseña**
- **Mínimo**: 8 caracteres
- **Recomendado**: 
  - Mayúsculas y minúsculas
  - Números
  - Caracteres especiales
  - No palabras comunes

### **Validaciones de Username**
- **Longitud**: 3-50 caracteres
- **Caracteres**: Letras, números, guiones bajos
- **Único**: No puede repetirse en el sistema

### **Validaciones de Email**
- **Formato**: Debe ser un email válido
- **Único**: No puede repetirse en el sistema
- **Verificación**: Se requiere verificación posterior

## 📧 Verificación de Email

### **Estado Inicial**
- Al registrarte, tu cuenta queda en estado `pending_verification`
- No puedes acceder a funcionalidades restringidas hasta verificar tu email

### **Proceso de Verificación**
1. **Recibir email** con enlace de verificación
2. **Hacer clic** en el enlace
3. **Cuenta activada** automáticamente
4. **Estado cambiado** a `active`

### **Endpoint de Verificación**
```http
POST /api/v1/auth/verify-email
```

### **Datos de Verificación**
```json
{
  "token": "verification_token_from_email"
}
```

## 🔐 Recuperación de Contraseña

### **Solicitar Reset**
```http
POST /api/v1/auth/forgot-password
```

### **Datos de Solicitud**
```json
{
  "email": "john@example.com"
}
```

### **Proceso de Reset**
1. **Solicitar reset** con tu email
2. **Recibir email** con token de reset
3. **Usar token** para establecer nueva contraseña
4. **Contraseña actualizada** exitosamente

### **Reset de Contraseña**
```http
POST /api/v1/auth/reset-password
```

### **Datos de Reset**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

## 📊 Estados de Cuenta

### **Estados Disponibles**
- **pending_verification**: Esperando verificación de email
- **active**: Cuenta activa y verificada
- **inactive**: Cuenta desactivada temporalmente
- **suspended**: Cuenta suspendida por admin
- **deleted**: Cuenta eliminada (soft delete)

### **Transiciones de Estado**
```
pending_verification → active (verificación de email)
active → inactive (desactivación manual)
active → suspended (suspensión por admin)
active → deleted (eliminación por usuario/admin)
```

## 🚨 Códigos de Error Comunes

### **400 Bad Request**
```json
{
  "message": "Validation failed",
  "details": ["username must not be empty"]
}
```

### **401 Unauthorized**
```json
{
  "message": "Invalid credentials"
}
```

### **409 Conflict**
```json
{
  "message": "User with this email or username already exists"
}
```

### **422 Unprocessable Entity**
```json
{
  "message": "Password must be at least 8 characters long"
}
```

## 📱 Casos de Uso Comunes

### **🟢 Primer Registro**
1. **Registrarse** con datos básicos
2. **Verificar email** para activar cuenta
3. **Completar perfil** con información adicional
4. **Configurar preferencias** según necesidades

### **🟡 Login Diario**
1. **Iniciar sesión** con email/username y contraseña
2. **Usar access token** para operaciones
3. **Renovar token** cuando expire
4. **Cerrar sesión** al terminar

### **🔴 Recuperación de Acceso**
1. **Solicitar reset** de contraseña
2. **Verificar email** con token
3. **Establecer nueva** contraseña
4. **Iniciar sesión** con nueva contraseña

## 🔄 Flujo Completo de Autenticación

### **1. Registro**
```
Usuario → Registro → Validación → Creación → Respuesta con Tokens
```

### **2. Verificación**
```
Email → Verificación → Activación → Cuenta Activa
```

### **3. Login**
```
Credenciales → Validación → Tokens → Acceso a API
```

### **4. Uso de API**
```
Request → Token → Validación → Respuesta
```

### **5. Renovación**
```
Token Expirado → Refresh → Nuevo Access Token
```

### **6. Logout**
```
Request → Invalidación → Sesión Cerrada
```

## 📝 Notas Importantes

### **Seguridad**
- **Nunca compartas** tus tokens
- **Usa HTTPS** en producción
- **Cambia contraseña** regularmente
- **Cierra sesión** en dispositivos compartidos

### **Performance**
- **Renueva tokens** antes de que expiren
- **Usa refresh tokens** para mantener sesión
- **Almacena tokens** de forma segura

### **Mantenimiento**
- **Verifica estado** de tu cuenta regularmente
- **Actualiza información** de contacto
- **Revisa actividad** de tu cuenta

## 🔗 Endpoints Relacionados

### **Autenticación**
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/verify-email` - Verificar email
- `POST /api/v1/auth/forgot-password` - Solicitar reset
- `POST /api/v1/auth/reset-password` - Reset contraseña

### **Usuario**
- `GET /api/v1/users/profile` - Ver perfil
- `PUT /api/v1/users/profile` - Actualizar perfil
- `DELETE /api/v1/users/profile` - Eliminar perfil

## 📞 Soporte

### **Problemas Comunes**
1. **No puedo registrarme**: Verificar que email/username no existan
2. **No puedo hacer login**: Verificar credenciales y estado de cuenta
3. **Token expirado**: Usar refresh token para renovar
4. **Cuenta no verificada**: Verificar email de activación

### **Contacto**
- **Documentación**: Revisar esta guía completa
- **Swagger**: `/api/docs` para documentación interactiva
- **Logs**: Verificar logs de la aplicación
- **Equipo**: Contactar al equipo de desarrollo

---

*Última actualización: 2025-08-29*
*Versión: 1.0*
*Guía de Autenticación - Pritzio Backend*
