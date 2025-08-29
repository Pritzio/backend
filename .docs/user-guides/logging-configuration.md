# Guía de Configuración de Logs - Usuario Final

## 📋 Introducción
Esta guía te ayudará a configurar y controlar los logs de la aplicación Pritzio Backend para que solo veas la información que realmente necesitas.

## 🎯 ¿Qué se puede configurar?

### **Tipos de Logs Disponibles:**
- **Logs de NestJS**: Información del sistema y errores importantes
- **Logs de Base de Datos**: Consultas SQL y operaciones de BD
- **Logs de Seguridad**: Eventos de autenticación y autorización
- **Logs de Endpoints**: Requests HTTP y respuestas

## 🚀 Comandos Rápidos

### **Configuración Básica**
```bash
# Ver configuración actual
npm run logs:status

# Solo errores y warnings (recomendado para desarrollo)
npm run logs:off

# Todos los logs activados
npm run logs:on
```

### **Configuración Avanzada**
```bash
# Solo logs de base de datos
npm run logs:typeorm-on
npm run logs:typeorm-off

# Solo logs de la aplicación
npm run logs:nestjs-on
npm run logs:nestjs-off
```

## 🔧 Configuración Detallada

### **1. Configuración Mínima (Recomendada)**
```bash
npm run logs:off
```
**Resultado:**
- ✅ Errores y warnings visibles
- ✅ Logs de NestJS importantes
- ❌ Logs de endpoints (login, requests, etc.)
- ❌ Logs de seguridad detallados
- ❌ Logs de consultas SQL

### **2. Configuración Completa (Debugging)**
```bash
npm run logs:on
```
**Resultado:**
- ✅ Todos los logs activados
- ✅ Información detallada de cada request
- ✅ Logs de seguridad completos
- ✅ Consultas SQL visibles
- ⚠️ Consola puede saturarse de información

### **3. Configuración Mixta**
```bash
# Activar solo logs de aplicación
npm run logs:nestjs-on

# Desactivar logs de base de datos
npm run logs:typeorm-off
```

## 📊 Estados de Configuración

### **Estado: Solo Errores**
```bash
ENABLE_LOGGING=true
TYPEORM_LOGGING=false
NESTJS_LOG_LEVELS=error,warn
ENABLE_SECURITY_LOGGING=false
```
**Ideal para:** Producción y desarrollo normal

### **Estado: Información Completa**
```bash
ENABLE_LOGGING=true
TYPEORM_LOGGING=true
NESTJS_LOG_LEVELS=error,warn,log,debug,verbose
ENABLE_SECURITY_LOGGING=true
```
**Ideal para:** Debugging y desarrollo avanzado

### **Estado: Solo NestJS**
```bash
ENABLE_LOGGING=true
TYPEORM_LOGGING=false
NESTJS_LOG_LEVELS=error,warn,log
ENABLE_SECURITY_LOGGING=false
```
**Ideal para:** Desarrollo con información esencial

## 🔍 Verificación de Configuración

### **Comando de Estado**
```bash
npm run logs:status
```

### **Salida Esperada**
```bash
📊 Estado Actual de Logs:
✅ ENABLE_LOGGING: true
❌ TYPEORM_LOGGING: false
📝 NESTJS_LOG_LEVELS: error,warn,log
❌ ENABLE_SECURITY_LOGGING: false

🎯 Configuración: Solo errores, warnings y logs esenciales
```

## 🚨 Solución de Problemas

### **Problema: Demasiados logs aparecen**
```bash
# Solución: Configurar solo errores
npm run logs:off
```

### **Problema: No se ven logs importantes**
```bash
# Solución: Activar logs de NestJS
npm run logs:nestjs-on
```

### **Problema: No se ven errores de base de datos**
```bash
# Solución: Activar logs de TypeORM
npm run logs:typeorm-on
```

### **Problema: Logs de seguridad saturan la consola**
```bash
# Solución: Desactivar logs de seguridad
# (Ya configurado por defecto)
```

## 📱 Casos de Uso Comunes

### **🟢 Desarrollo Normal**
```bash
npm run logs:off
```
- Ver solo errores y warnings
- Consola limpia y fácil de leer
- Información esencial visible

### **🟡 Debugging de Problemas**
```bash
npm run logs:nestjs-on
npm run logs:typeorm-on
```
- Ver todos los logs de la aplicación
- Identificar problemas de base de datos
- Trazar flujo de requests

### **🔴 Producción**
```bash
npm run logs:off
```
- Solo errores críticos visibles
- Performance optimizada
- Logs estructurados en archivos

### **🟠 Testing**
```bash
npm run logs:on
```
- Ver todos los logs durante pruebas
- Identificar problemas de integración
- Verificar flujo completo de datos

## 🔄 Reinicio de Aplicación

### **Importante:**
Después de cambiar la configuración de logs, **debes reiniciar la aplicación** para que los cambios tomen efecto.

```bash
# Detener aplicación
Ctrl + C

# Reiniciar
npm run start:dev
```

## 📝 Variables de Entorno

### **Configuración Manual (.env)**
Si prefieres configurar manualmente, puedes editar el archivo `.env`:

```bash
# Control de logs
ENABLE_LOGGING=true
TYPEORM_LOGGING=false
NESTJS_LOG_LEVELS=error,warn,log
ENABLE_SECURITY_LOGGING=false
```

### **Explicación de Variables**
- **ENABLE_LOGGING**: Activa/desactiva logs de NestJS
- **TYPEORM_LOGGING**: Activa/desactiva logs de base de datos
- **NESTJS_LOG_LEVELS**: Niveles de log a mostrar
- **ENABLE_SECURITY_LOGGING**: Activa/desactiva logs de seguridad

## 🎯 Recomendaciones

### **Para Desarrolladores:**
- **Desarrollo diario**: `npm run logs:off`
- **Debugging**: `npm run logs:on`
- **Testing**: `npm run logs:on`

### **Para DevOps:**
- **Desarrollo**: `npm run logs:off`
- **Staging**: `npm run logs:off`
- **Producción**: `npm run logs:off`

### **Para QA:**
- **Testing funcional**: `npm run logs:off`
- **Testing de integración**: `npm run logs:on`
- **Reporte de bugs**: `npm run logs:on`

## 🔗 Comandos Relacionados

### **Gestión de Aplicación**
```bash
# Iniciar en modo desarrollo
npm run start:dev

# Iniciar en modo debug
npm run start:debug

# Compilar aplicación
npm run build
```

### **Verificación de Estado**
```bash
# Estado de logs
npm run logs:status

# Estado de la aplicación
curl http://localhost:3000/health
```

---

## 📞 Soporte

Si tienes problemas con la configuración de logs:

1. **Verificar estado actual**: `npm run logs:status`
2. **Reiniciar aplicación** después de cambios
3. **Revisar archivo .env** para configuración manual
4. **Contactar al equipo de desarrollo** si persisten los problemas

---

*Última actualización: 2025-08-29*
*Versión: 1.0*
*Documentación para usuarios finales*
