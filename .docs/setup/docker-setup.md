# 🐳 Configuración de Docker - Pritzio Backend

Esta guía explica cómo configurar y usar Docker para el desarrollo y producción del proyecto Pritzio Backend.

## 📋 **Tabla de Contenidos**

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Comandos Disponibles](#comandos-disponibles)
- [Entorno de Desarrollo](#entorno-de-desarrollo)
- [Entorno de Producción](#entorno-de-producción)
- [Troubleshooting](#troubleshooting)
- [Mejores Prácticas](#mejores-prácticas)

## 🔧 **Requisitos**

### **Software Requerido**
- **Docker Desktop**: Versión 4.0+ para macOS/Windows
- **Docker Engine**: Versión 20.10+ para Linux
- **Docker Compose**: Versión 2.0+ (incluido en Docker Desktop)

### **Verificar Instalación**
```bash
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version

# Verificar que Docker esté corriendo
docker info
```

## 🚀 **Instalación**

### **1. Instalar Docker Desktop**
- **macOS**: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows**: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Instrucciones de instalación](https://docs.docker.com/engine/install/)

### **2. Configurar el Proyecto**
```bash
# Clonar el repositorio
git clone <repository-url>
cd pritzio-backend

# Copiar archivo de entorno
cp env.example .env

# Editar variables de entorno
nano .env
```

### **3. Variables de Entorno Necesarias**
```bash
# Docker
NODE_ENV=development
BACKEND_PORT=3000

# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=pritzio
DATABASE_USER=pritzio_user
DATABASE_PASSWORD=pritzio_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=pritzio_redis_password
```

## 🎛️ **Comandos Disponibles**

### **Script Principal de Docker**
El proyecto incluye un script completo para gestionar Docker:

```bash
# Ver todos los comandos disponibles
./docker/scripts/docker-commands.sh help
```

### **Comandos de Desarrollo**

#### **Iniciar Entorno Completo**
```bash
# Iniciar PostgreSQL y Redis para desarrollo
./docker/scripts/docker-commands.sh dev

# Construir e iniciar (si hay cambios en Dockerfile)
./docker/scripts/docker-commands.sh dev-build

# Ver logs de desarrollo
./docker/scripts/docker-commands.sh dev-logs

# Detener entorno de desarrollo
./docker/scripts/docker-commands.sh dev-stop
```

#### **Comandos Individuales de Base de Datos**
```bash
# Solo PostgreSQL
./docker/scripts/docker-commands.sh db-start
./docker/scripts/docker-commands.sh db-stop
./docker/scripts/docker-commands.sh db-reset
./docker/scripts/docker-commands.sh db-backup
```

#### **Comandos Individuales de Redis**
```bash
# Solo Redis
./docker/scripts/docker-commands.sh redis-start
./docker/scripts/docker-commands.sh redis-stop
./docker/scripts/docker-commands.sh redis-cli
```

### **Comandos de Producción**
```bash
# Iniciar entorno de producción
./docker/scripts/docker-commands.sh prod

# Construir e iniciar producción
./docker/scripts/docker-commands.sh prod-build

# Ver logs de producción
./docker/scripts/docker-commands.sh prod-logs

# Detener entorno de producción
./docker/scripts/docker-commands.sh prod-stop
```

### **Comandos de Utilidades**
```bash
# Ver estado de todos los servicios
./docker/scripts/docker-commands.sh status

# Ver logs de todos los servicios
./docker/scripts/docker-commands.sh logs

# Limpiar contenedores e imágenes no utilizadas
./docker/scripts/docker-commands.sh clean
```

## 🛠️ **Entorno de Desarrollo**

### **Flujo de Trabajo Recomendado**

#### **1. Iniciar Servicios**
```bash
# Iniciar PostgreSQL y Redis
./docker/scripts/docker-commands.sh dev

# Verificar estado
./docker/scripts/docker-commands.sh status
```

#### **2. Iniciar Aplicación**
```bash
# Instalar dependencias (primera vez)
npm install

# Iniciar en modo desarrollo
npm run start:dev
```

#### **3. Verificar Funcionamiento**
```bash
# Verificar base de datos
curl http://localhost:3000/api/v1/health

# Ver logs de servicios
./docker/scripts/docker-commands.sh dev-logs
```

### **Acceso a Servicios**

#### **PostgreSQL**
```bash
# Conectar desde terminal
docker exec -it pritzio-postgres psql -U pritzio_user -d pritzio

# Ver logs
docker logs pritzio-postgres

# Ejecutar comando SQL
docker exec -it pritzio-postgres psql -U pritzio_user -d pritzio -c "SELECT version();"
```

#### **Redis**
```bash
# Conectar CLI
./docker/scripts/docker-commands.sh redis-cli

# Ver logs
docker logs pritzio-redis

# Ejecutar comando
docker exec -it pritzio-redis redis-cli ping
```

## 🚀 **Entorno de Producción**

### **Configuración de Producción**
```bash
# Variables de entorno para producción
NODE_ENV=production
BACKEND_PORT=3000
DATABASE_HOST=postgres
REDIS_HOST=redis

# Iniciar servicios de producción
./docker/scripts/docker-commands.sh prod
```

### **Docker Compose de Producción**
```bash
# Construir e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **1. Puerto ya en uso**
```bash
# Verificar qué está usando el puerto
lsof -ti:3000
lsof -ti:5432
lsof -ti:6379

# Matar proceso
kill -9 <PID>
```

#### **2. Contenedores no inician**
```bash
# Ver logs de Docker
docker-compose logs

# Verificar estado
./docker/scripts/docker-commands.sh status

# Reiniciar Docker Desktop
```

#### **3. Problemas de Base de Datos**
```bash
# Verificar conexión
docker exec -it pritzio-postgres psql -U pritzio_user -d pritzio -c "SELECT 1;"

# Resetear base de datos
./docker/scripts/docker-commands.sh db-reset

# Ver logs de PostgreSQL
docker logs pritzio-postgres
```

#### **4. Problemas de Redis**
```bash
# Verificar conexión
docker exec -it pritzio-redis redis-cli ping

# Ver logs de Redis
docker logs pritzio-redis

# Reiniciar Redis
./docker/scripts/docker-commands.sh redis-stop
./docker/scripts/docker-commands.sh redis-start
```

### **Comandos de Debug**
```bash
# Ver todos los contenedores
docker ps -a

# Ver logs de un contenedor específico
docker logs <container-name>

# Ver uso de recursos
docker stats

# Ver información del sistema Docker
docker system df
```

## 📚 **Mejores Prácticas**

### **Desarrollo**
1. **Usar el script**: Siempre usar `./docker/scripts/docker-commands.sh` en lugar de comandos directos
2. **Verificar estado**: Usar `status` antes de iniciar servicios
3. **Logs**: Usar `dev-logs` para debugging
4. **Limpieza**: Usar `clean` regularmente para liberar espacio

### **Producción**
1. **Variables de entorno**: Nunca usar valores por defecto en producción
2. **Backups**: Hacer backups regulares con `db-backup`
3. **Monitoreo**: Usar `prod-logs` para monitorear servicios
4. **Seguridad**: Cambiar contraseñas por defecto

### **Mantenimiento**
1. **Actualizaciones**: Mantener Docker y docker-compose actualizados
2. **Limpieza**: Ejecutar `clean` semanalmente
3. **Logs**: Rotar logs para evitar llenar el disco
4. **Backups**: Automatizar backups de base de datos

## 🔗 **Enlaces Útiles**

- **[Docker Documentation](https://docs.docker.com/)**
- **[Docker Compose Documentation](https://docs.docker.com/compose/)**
- **[PostgreSQL Docker Image](https://hub.docker.com/_/postgres)**
- **[Redis Docker Image](https://hub.docker.com/_/redis)**

## 📞 **Soporte**

### **Problemas del Script**
Si tienes problemas con el script de Docker:
1. Verificar que Docker esté corriendo
2. Verificar permisos de ejecución: `chmod +x docker/scripts/docker-commands.sh`
3. Verificar que estés en el directorio raíz del proyecto

### **Problemas de Docker**
Para problemas generales de Docker:
1. Reiniciar Docker Desktop
2. Verificar logs de Docker
3. Consultar la documentación oficial de Docker

---

**Última Actualización**: 2025-08-21  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo Pritzio
