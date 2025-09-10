# Scripts Esenciales - Pritzio Backend

Esta carpeta contiene scripts esenciales para el funcionamiento, despliegue y mantenimiento de la aplicación.

## 📁 Scripts de Migración de Base de Datos

### Migraciones Principales
- `add-base-products-migration.sql` - Migración principal para productos base
- `add-storeproductid-column.sql` - Agregar columna storeProductId
- `add-terms-acceptance.sql` - Agregar campos de aceptación de términos
- `add-unique-indexes-store-products.sql` - Índices únicos para store_products
- `create-categories-tables.sql` - Crear tablas de categorías
- `store-products-enhancement-migration.sql` - Mejoras a store_products

### Correcciones y Fixes
- `fix-base-products-migration.sql` - Corrección de migración de productos base
- `fix-column-limit.sql` - Corrección de límite de columnas
- `fix-timezone-and-date-format.sql` - Configuración de zona horaria
- `fix-trigger-final.sql` - Corrección final de triggers
- `fix-trigger-store-id.sql` - Corrección de trigger store_id

## 🚀 Scripts de Despliegue

### Producción
- `deploy-production.sh` - Despliegue a producción
- `deploy-staging.sh` - Despliegue a staging

### Configuración
- `setup-cors.sh` - Configuración de CORS
- `logs-control.sh` - Control de logs de la aplicación

## 👤 Scripts de Usuario

### Administración
- `create-super-admin.sh` - Crear super administrador
- `create-super-admin.sql` - SQL para crear super administrador

## 🎯 Uso

### Migraciones
```bash
# Ejecutar migración específica
psql -h localhost -U pritzio_user -d pritzio -f scripts/add-base-products-migration.sql

# Ejecutar todas las migraciones en orden
./scripts/run-migrations.sh
```

### Despliegue
```bash
# Despliegue a staging
./scripts/deploy-staging.sh

# Despliegue a producción
./scripts/deploy-production.sh
```

### Configuración
```bash
# Configurar CORS
./scripts/setup-cors.sh

# Controlar logs
./scripts/logs-control.sh on
```

### Administración
```bash
# Crear super administrador
./scripts/create-super-admin.sh
```

## ⚠️ Importante

- Estos scripts son **esenciales** para el funcionamiento de la aplicación
- **Siempre** hacer backup antes de ejecutar migraciones
- **Verificar** la configuración antes de desplegar
- Los scripts de **producción** requieren configuración previa

## 📝 Notas

- Los scripts de **desarrollo y pruebas** están en `.dev/scripts/`
- Los scripts de **migración** deben ejecutarse en orden
- Los scripts de **despliegue** requieren configuración de entorno
- Los scripts de **administración** crean usuarios del sistema

## 🔗 Enlaces Relacionados

- [Scripts de Desarrollo](.dev/scripts/README.md) - Scripts de testing y desarrollo
- [Documentación de API](.docs/api/) - Documentación de endpoints
- [Configuración](.dev/) - Configuración de desarrollo

