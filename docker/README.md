# 🐳 Docker - Pritzio Backend

## 📋 **Descripción General**

Esta carpeta contiene toda la configuración Docker necesaria para ejecutar el backend de Pritzio en un entorno containerizado, incluyendo:

- **Backend NestJS** - Aplicación principal
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **Adminer** - Interfaz web para gestión de base de datos

## 🚀 **Inicio Rápido**

### **1. Requisitos Previos**
```bash
# Verificar que Docker esté instalado
docker --version
docker-compose --version

# Verificar que Docker Desktop esté corriendo
docker info
```

### **2. Configurar Variables de Entorno**
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables según tu entorno
nano .env
```

### **3. Elegir Flujo de Trabajo**

#### **Opción A: Desarrollo Local (Recomendado)**
```bash
# Solo servicios de base de datos
./docker/scripts/docker-commands.sh dev

# Backend corriendo localmente
npm run start:dev
```

#### **Opción B: Desarrollo Completo con Docker**
```bash
# Todo en Docker
./docker/scripts/docker-commands.sh dev-build
```

#### **Opción C: Producción**
```bash
# Entorno de producción
./docker/scripts/docker-commands.sh prod
```

## 🛠️ **Comandos Útiles**

### **Script de Comandos Docker**
```bash
# Dar permisos de ejecución
chmod +x docker/scripts/docker-commands.sh

# Ver todos los comandos disponibles
./docker/scripts/docker-commands.sh help

# Iniciar solo base de datos y Redis (desarrollo)
./docker/scripts/docker-commands.sh dev

# Iniciar entorno completo
./docker/scripts/docker-commands.sh dev-build

# Ver logs
./docker/scripts/docker-commands.sh logs

# Ver estado
./docker/scripts/docker-commands.sh status
```

### **Comandos Docker Compose Directos**
```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reconstruir e iniciar
docker-compose up -d --build

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Ejecutar comando en un contenedor
docker-compose exec backend npm run test
docker-compose exec postgres psql -U pritzio_user -d pritzio
docker-compose exec redis redis-cli
```

## 🏗️ **Arquitectura de Servicios**

### **Backend (NestJS)**
- **Puerto**: 3000 (configurable)
- **Imagen**: Construida desde Dockerfile
- **Dependencias**: PostgreSQL, Redis
- **Volúmenes**: logs/, uploads/
- **Health Check**: /health endpoint

### **PostgreSQL**
- **Puerto**: 5432 (configurable)
- **Versión**: 15-alpine
- **Base de datos**: pritzio
- **Usuario**: pritzio_user
- **Esquemas**: auth, users, products, prices, locations, social, notifications, analytics
- **Extensiones**: uuid-ossp, pgcrypto, postgis

### **Redis**
- **Puerto**: 6379 (configurable)
- **Versión**: 7-alpine
- **Persistencia**: AOF habilitado
- **Autenticación**: Opcional (configurable)

### **Adminer (Opcional)**
- **Puerto**: 8080 (configurable)
- **Perfil**: tools (no se inicia por defecto)
- **Uso**: Gestión visual de base de datos

## ⚙️ **Configuración de Variables de Entorno**

### **Variables Principales**
```bash
# Aplicación
NODE_ENV=development
BACKEND_PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:4200

# Base de Datos
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=pritzio
DATABASE_USER=pritzio_user
DATABASE_PASSWORD=pritzio_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### **Variables de Desarrollo vs Producción**
```bash
# Desarrollo
NODE_ENV=development
BACKEND_PORT=3000
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# Producción
NODE_ENV=production
BACKEND_PORT=80
LOG_LEVEL=info
ENABLE_SWAGGER=false
```

## 🔧 **Configuración de Base de Datos**

### **Inicialización Automática**
La base de datos se inicializa automáticamente con TypeORM:

- **Entidades TypeORM** crean las tablas automáticamente
- **Migrations** para cambios de esquema controlados
- **Synchronize** en desarrollo para auto-creación
- **Seeders** opcionales para datos iniciales

### **Esquemas Disponibles**
```
auth/           - Autenticación y autorización
users/          - Gestión de usuarios
products/       - Catálogo de productos
prices/         - Historial de precios
locations/      - Ubicaciones y geolocalización
social/         - Funcionalidades sociales
notifications/  - Sistema de notificaciones
analytics/      - Métricas y análisis
```

### **Funciones de Utilidad**
- `update_updated_at_column()` - Actualizar timestamp automáticamente
- `validate_email()` - Validar formato de email
- `validate_coordinates()` - Validar coordenadas geográficas
- `calculate_distance()` - Calcular distancia entre puntos
- `generate_unique_slug()` - Generar slugs únicos
- `clean_text()` - Limpiar texto de caracteres especiales

## 📊 **Monitoreo y Health Checks**

### **Health Checks Implementados**
- **Backend**: Endpoint /health
- **PostgreSQL**: pg_isready
- **Redis**: redis-cli ping

### **Métricas Disponibles**
- **Base de datos**: Tamaño, conexiones activas, cache hit ratio
- **Sistema**: Logs, métricas, health checks
- **Performance**: Índices, autovacuum, WAL

### **Logs del Sistema**
- **Niveles**: debug, info, warn, error, fatal
- **Contexto**: JSON con información adicional
- **Retención**: Configurable (por defecto 30 días)

## 🚨 **Seguridad**

### **Mejores Prácticas Implementadas**
- **Usuario no-root** en contenedores
- **Redes aisladas** entre servicios
- **Volúmenes persistentes** para datos
- **Health checks** para monitoreo
- **Variables de entorno** para configuración
- **Extensiones de seguridad** en PostgreSQL

### **Configuraciones de Seguridad**
```bash
# PostgreSQL
- Usuario dedicado para la aplicación
- Usuario de solo lectura para analytics
- Extensiones de criptografía habilitadas
- WAL configurado para replicación

# Redis
- Autenticación opcional
- Red aislada
- Persistencia habilitada

# Backend
- Usuario no-root
- Health checks
- Variables de entorno seguras
```

## 🔄 **Flujos de Trabajo**

### **Desarrollo Local (Recomendado)**
```bash
# 1. Iniciar solo base de datos y Redis
./docker/scripts/docker-commands.sh dev

# 2. Ejecutar backend localmente
npm run start:dev

# 3. Ver logs de servicios
./docker/scripts/docker-commands.sh dev-logs

# 4. Detener servicios
./docker/scripts/docker-commands.sh dev-stop
```

**Ventajas:**
- ✅ **Hot reload** - Cambios inmediatos en el código
- ✅ **Debugging fácil** - Acceso directo al código
- ✅ **Menos recursos** - Solo servicios necesarios
- ✅ **Desarrollo rápido** - No rebuild del backend

### **Desarrollo Completo con Docker**
```bash
# 1. Construir e iniciar todo
./docker/scripts/docker-commands.sh dev-build

# 2. Ver logs
./docker/scripts/docker-commands.sh dev-logs

# 3. Detener servicios
./docker/scripts/docker-commands.sh dev-stop
```

**Cuándo usar:**
- 🔄 **Testing** de la imagen Docker
- 🐳 **Verificar** que todo funcione en contenedores
- 🚀 **Preparar** para producción

### **Producción**
```bash
# 1. Configurar variables de producción
cp env.example .env.prod
# Editar .env.prod

# 2. Iniciar entorno de producción
./docker/scripts/docker-commands.sh prod

# 3. Monitorear
./docker/scripts/docker-commands.sh status
```

**Características:**
- 🚀 **Optimizado** para producción
- 🔒 **Seguridad** mejorada
- 📊 **Monitoreo** completo
- 🏗️ **Escalabilidad** preparada

## 🧪 **Testing y Debugging**

### **Acceso a Servicios**
```bash
# Base de datos
docker-compose exec postgres psql -U pritzio_user -d pritzio

# Redis
docker-compose exec redis redis-cli

# Backend
docker-compose exec backend sh
```

### **Logs y Debugging**
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Ver logs con timestamps
docker-compose logs -f -t
```

### **Inspección de Contenedores**
```bash
# Ver información del contenedor
docker inspect pritzio-backend

# Ver uso de recursos
docker stats

# Ver procesos del contenedor
docker top pritzio-backend
```

## 📁 **Estructura de Archivos**

```
docker/
├── README.md                           # Esta documentación
├── scripts/
│   └── docker-commands.sh             # Script de comandos útiles
└── volumes/                            # Volúmenes persistentes (se crean automáticamente)

# Archivos en la raíz del proyecto
Dockerfile                              # Imagen del backend
docker-compose.yml                      # Orquestación completa (desarrollo + producción)
docker-compose.dev.yml                  # Solo servicios de base de datos (desarrollo local)
.dockerignore                           # Archivos a ignorar en build
env.example                             # Variables de entorno de ejemplo
```

## 🏗️ **Archivos de Docker Compose**

### **docker-compose.yml (Completo)**
- **Propósito**: Desarrollo completo con Docker + Producción
- **Servicios**: Backend, PostgreSQL, Redis
- **Uso**: `./docker/scripts/docker-commands.sh dev-build` o `prod`

### **docker-compose.dev.yml (Desarrollo Local)**
- **Propósito**: Solo servicios de base de datos para desarrollo local
- **Servicios**: PostgreSQL, Redis
- **Uso**: `./docker/scripts/docker-commands.sh dev`
- **Ventajas**: Más rápido, hot reload, debugging fácil

## 🚀 **Despliegue**

### **Entorno de Desarrollo Local**
```bash
# Variables de entorno
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# Puertos
BACKEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Flujo de trabajo
./docker/scripts/docker-commands.sh dev  # Solo DB + Redis
npm run start:dev                         # Backend local
```

### **Entorno de Desarrollo con Docker**
```bash
# Variables de entorno
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# Puertos
BACKEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Flujo de trabajo
./docker/scripts/docker-commands.sh dev-build  # Todo en Docker
```

### **Entorno de Producción**
```bash
# Variables de entorno
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false

# Puertos
BACKEND_PORT=80
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### **Escalabilidad**
```bash
# Escalar backend
docker-compose up -d --scale backend=3

# Escalar con balanceador de carga
# (Requiere configuración adicional de nginx/traefik)
```

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **1. Puerto ya en uso**
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Cambiar puerto en .env
BACKEND_PORT=3001
```

#### **2. Base de datos no inicia**
```bash
# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar variables de entorno
docker-compose config

# Resetear base de datos
./docker/scripts/docker-commands.sh db-reset
```

#### **3. Redis no responde**
```bash
# Ver logs de Redis
docker-compose logs redis

# Acceder a Redis CLI
docker-compose exec redis redis-cli ping
```

#### **4. Backend no se conecta a la base de datos**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Verificar variables de entorno
echo $DATABASE_HOST
echo $DATABASE_PORT

# Ver logs del backend
docker-compose logs backend
```

### **Comandos de Debugging**
```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs

# Ver configuración de docker-compose
docker-compose config

# Ver uso de recursos
docker stats

# Limpiar Docker
./docker/scripts/docker-commands.sh clean
```

## 📚 **Recursos Adicionales**

### **Documentación Oficial**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

## 🤔 **Decisiones de Arquitectura**

### **¿Por qué dos archivos de Docker Compose?**

#### **Problema Original:**
- Un solo archivo para todos los casos
- Backend siempre en Docker (lento para desarrollo)
- No flexibilidad en flujos de trabajo

#### **Solución Implementada:**
- **docker-compose.yml**: Completo para desarrollo Docker + producción
- **docker-compose.dev.yml**: Ligero para desarrollo local
- Scripts inteligentes que eligen el archivo correcto

#### **Beneficios:**
- 🚀 **Desarrollo local más rápido**
- 🔄 **Hot reload** del backend
- 🐛 **Debugging más fácil**
- 📊 **Menos uso de recursos**
- 🎯 **Flexibilidad** para elegir el flujo

### **¿Cuándo usar cada uno?**

| Escenario | Archivo | Comando | Ventajas |
|-----------|---------|---------|----------|
| **Desarrollo Local** | `docker-compose.dev.yml` | `./docker/scripts/docker-commands.sh dev` | Rápido, hot reload, debugging |
| **Testing Docker** | `docker-compose.yml` | `./docker/scripts/docker-commands.sh dev-build` | Verificar contenedores |
| **Producción** | `docker-compose.yml` | `./docker/scripts/docker-commands.sh prod` | Optimizado, seguro |

### **Extensiones Útiles**
- **PostGIS**: Para funcionalidades geográficas
- **pgcrypto**: Para criptografía
- **uuid-ossp**: Para generación de UUIDs

### **Herramientas de Monitoreo**
- **Adminer**: Gestión visual de base de datos
- **pgAdmin**: Alternativa a Adminer (requiere configuración adicional)
- **Redis Commander**: Interfaz web para Redis (requiere configuración adicional)

---

**Última Actualización**: 2024-01-15  
**Mantenedor**: AI Assistant  
**Versión**: 1.0.0
