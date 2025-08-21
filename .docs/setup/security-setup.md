# 🛡️ Sistema de Seguridad - Pritzio Backend

Esta guía documenta el sistema de seguridad implementado en el proyecto Pritzio Backend, que incluye múltiples capas de protección contra ataques comunes.

## 📋 **Tabla de Contenidos**

- [Arquitectura de Seguridad](#arquitectura-de-seguridad)
- [Componentes del Sistema](#componentes-del-sistema)
- [Configuración](#configuración)
- [Uso de Decoradores](#uso-de-decoradores)
- [Middleware de Seguridad](#middleware-de-seguridad)
- [Interceptores](#interceptores)
- [Guards](#guards)
- [Logging de Seguridad](#logging-de-seguridad)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🏗️ **Arquitectura de Seguridad**

### **Capas de Protección**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente/Frontend                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Security Middleware                         │
│  • Helmet (Headers de seguridad)                           │
│  • Rate Limiting                                           │
│  • CORS                                                    │
│  • XSS Protection                                          │
│  • HPP Protection                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Validation Interceptor                       │
│  • Sanitización de datos                                   │
│  • Validación de DTOs                                      │
│  • Prevención de inyección                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Security Logging Interceptor                   │
│  • Logging de eventos de seguridad                         │
│  • Detección de patrones sospechosos                       │
│  • Auditoría completa                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Guards                                   │
│  • JWT Authentication                                      │
│  • Role-based Access Control                               │
│  • API Key Validation                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Controllers                                │
│  • Lógica de negocio                                       │
│  • Respuestas seguras                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Componentes del Sistema**

### **1. Security Middleware**
- **Ubicación**: `src/common/security/middleware/security.middleware.ts`
- **Función**: Primera línea de defensa, aplica headers de seguridad y rate limiting
- **Características**:
  - Helmet para headers de seguridad
  - Rate limiting por IP + User-Agent
  - Speed limiting para requests excesivos
  - CORS configurado
  - XSS y HPP protection
  - Validación de request básica

### **2. Validation Interceptor**
- **Ubicación**: `src/common/security/interceptors/validation.interceptor.ts`
- **Función**: Sanitiza y valida todos los datos de entrada
- **Características**:
  - Sanitización de HTML y scripts
  - Validación de DTOs con class-validator
  - Prevención de inyección de código
  - Límites de tamaño de payload

### **3. Security Logging Interceptor**
- **Ubicación**: `src/common/security/interceptors/security-logging.interceptor.ts`
- **Función**: Registra todos los eventos de seguridad
- **Características**:
  - Logging detallado de requests
  - Detección de patrones sospechosos
  - Auditoría completa de acceso
  - Flags de seguridad automáticos

### **4. API Key Guard**
- **Ubicación**: `src/common/security/guards/api-key.guard.ts`
- **Función**: Valida API keys para endpoints protegidos
- **Características**:
  - Validación de API keys desde headers
  - Configuración desde variables de entorno
  - Logging de intentos de acceso

### **5. Security Decorators**
- **Ubicación**: `src/common/security/decorators/security.decorators.ts`
- **Función**: Aplicar diferentes niveles de seguridad a endpoints
- **Decoradores disponibles**:
  - `@BasicSecurity()` - Validación básica
  - `@StrictSecurity()` - Validación estricta + logging
  - `@ApiKeyProtected()` - Requiere API key
  - `@AdminOnly()` - Solo administradores
  - `@SystemOnly()` - Solo sistema interno

## ⚙️ **Configuración**

### **Variables de Entorno**

```bash
# Security Configuration
VALID_API_KEYS=pritzio-dev-key,pritzio-prod-key
SECURITY_LOG_LEVEL=info
ENABLE_SECURITY_LOGGING=true
MAX_PAYLOAD_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Configuración del Middleware**

```typescript
// src/app.module.ts
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
```

## 🎯 **Uso de Decoradores**

### **Seguridad Básica**
```typescript
@Post('register')
@BasicSecurity()
async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
  return this.authService.register(registerDto);
}
```

### **Seguridad Estricta**
```typescript
@Post('login')
@StrictSecurity()
async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
  return this.authService.login(loginDto);
}
```

### **Protección con API Key**
```typescript
@Get('admin/users')
@ApiKeyProtected()
async getUsers(): Promise<User[]> {
  return this.userService.findAll();
}
```

### **Solo Administradores**
```typescript
@Put('admin/system-config')
@AdminOnly()
async updateSystemConfig(@Body() config: SystemConfigDto): Promise<void> {
  return this.systemService.updateConfig(config);
}
```

### **Validación Personalizada**
```typescript
@Post('upload')
@ValidatePayload()
@MaxPayloadSize(5 * 1024 * 1024) // 5MB
@ContentValidation({ allowHtml: false, maxLength: 1000 })
async uploadFile(@Body() fileData: FileUploadDto): Promise<void> {
  // Lógica de upload
}
```

## 🚀 **Middleware de Seguridad**

### **Headers de Seguridad Aplicados**

```typescript
// Headers automáticos aplicados por Helmet
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### **Rate Limiting**

```typescript
// Configuración por defecto
windowMs: 15 * 60 * 1000, // 15 minutos
max: 100, // máximo 100 requests por ventana
delayAfter: 50, // después de 50 requests
delayMs: 500, // agregar 500ms de delay por request
```

### **CORS Configurado**

```typescript
// Orígenes permitidos
allowedOrigins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'https://pritzio.com',
  'https://app.pritzio.com',
]
```

## 🔍 **Interceptores**

### **Validation Interceptor**

```typescript
// Sanitización automática
- Remueve HTML y scripts
- Previene inyección de código
- Valida tamaño de payload
- Sanitiza nombres de propiedades
```

### **Security Logging Interceptor**

```typescript
// Información capturada
- IP del cliente
- User-Agent
- Headers de seguridad
- Tiempo de respuesta
- Tamaño de request/response
- Flags de seguridad
- Patrones sospechosos
```

## 🛡️ **Guards**

### **API Key Guard**

```typescript
// Uso
@Get('protected-endpoint')
@UseGuards(ApiKeyGuard)
async protectedMethod(): Promise<any> {
  // Solo accesible con API key válida
}

// Header requerido
X-API-Key: your-api-key-here
```

### **JWT Auth Guard (Existente)**

```typescript
// Uso
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User): Promise<User> {
  return user;
}
```

## 📊 **Logging de Seguridad**

### **Eventos Registrados**

```typescript
interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  userId?: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  headers: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
  error?: string;
  securityFlags: string[];
}
```

### **Flags de Seguridad Automáticos**

- `SUSPICIOUS_USER_AGENT` - User-Agent sospechoso
- `SUSPICIOUS_IP` - IP sospechosa
- `RATE_LIMIT_EXCEEDED` - Rate limit excedido
- `MALICIOUS_CONTENT` - Contenido malicioso detectado
- `UNUSUAL_PATTERN` - Patrón inusual de request

### **Ejemplo de Log**

```json
{
  "message": "Security Event [SUCCESS]: POST /api/v1/auth/login - 200 (45ms)",
  "event": {
    "timestamp": "2025-08-21T10:30:00.000Z",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "method": "POST",
    "url": "/api/v1/auth/login",
    "statusCode": 200,
    "responseTime": 45,
    "securityFlags": []
  },
  "type": "SUCCESS"
}
```

## 🎯 **Mejores Prácticas**

### **1. Aplicar Seguridad por Defecto**
```typescript
// En lugar de esto
@Post('endpoint')
async method() {}

// Usar esto
@Post('endpoint')
@BasicSecurity()
async method() {}
```

### **2. Usar Niveles Apropiados**
```typescript
// Endpoints públicos
@Public()
@BasicSecurity()

// Endpoints de autenticación
@StrictSecurity()

// Endpoints administrativos
@AdminOnly()

// Endpoints del sistema
@SystemOnly()
```

### **3. Configurar Rate Limiting Apropiado**
```typescript
// Para endpoints sensibles
@RateLimit({ windowMs: 60000, max: 5 }) // 5 requests por minuto
@Post('reset-password')
async resetPassword() {}
```

### **4. Validar y Sanitizar Datos**
```typescript
// Siempre usar DTOs con validación
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
```

### **5. Monitorear Logs de Seguridad**
```bash
# Ver logs de seguridad en tiempo real
npm run start:dev | grep "Security Event"

# Buscar eventos sospechosos
grep "SUSPICIOUS" logs/app.log
```

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **1. Rate Limit Exceeded**
```bash
# Error: Too many requests from this IP
# Solución: Esperar 15 minutos o ajustar configuración
```

#### **2. CORS Errors**
```bash
# Error: Not allowed by CORS
# Solución: Verificar origen en allowedOrigins
```

#### **3. Payload Too Large**
```bash
# Error: Request payload exceeds maximum allowed size
# Solución: Reducir tamaño o ajustar MAX_PAYLOAD_SIZE
```

#### **4. Invalid API Key**
```bash
# Error: API key is required / Invalid API key
# Solución: Verificar header X-API-Key y VALID_API_KEYS
```

### **Debug de Seguridad**

```typescript
// Habilitar logging detallado
SECURITY_LOG_LEVEL=debug
ENABLE_SECURITY_LOGGING=true

// Ver logs en consola
npm run start:dev
```

### **Testing de Seguridad**

```bash
# Test de rate limiting
for i in {1..110}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"test"}'
done

# Test de payload size
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${'x'.repeat(10000)}\"}"
```

## 📚 **Recursos Adicionales**

- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)**
- **[Helmet.js](https://helmetjs.github.io/)**
- **[Express Rate Limit](https://github.com/nfriedly/express-rate-limit)**
- **[Class Validator](https://github.com/typestack/class-validator)**
- **[Sanitize HTML](https://github.com/apostrophecms/sanitize-html)**

---

**Última Actualización**: 2025-08-21  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo Pritzio
