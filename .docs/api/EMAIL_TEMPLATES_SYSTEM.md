# 📧 Sistema de Plantillas de Correo Electrónico

## 🎯 **Arquitectura del Sistema**

### **Backend (Plantillas + Lógica)**
- **✅ Plantillas HTML centralizadas** en `EmailTemplateService`
- **✅ Lógica de envío** en `EmailService`
- **✅ Seguridad y validación** server-side
- **✅ Personalización dinámica** por usuario

### **Frontend (Solo UI)**
- **✅ Configuración de preferencias** de correo
- **✅ Preview de plantillas** (solo lectura)
- **✅ Configuración de notificaciones**

## 🏗️ **Estructura del Sistema**

```
src/common/services/
├── email.service.ts              # Servicio principal de envío
├── email-template.service.ts     # Servicio de plantillas HTML
└── ...

src/common/modules/
└── email.module.ts              # Módulo de email
```

## 📋 **Plantillas Disponibles**

### **1. 🎉 Correo de Bienvenida**
- **Método:** `getWelcomeTemplate(user)`
- **Uso:** Envío automático al registrarse
- **Características:**
  - Diseño responsive y moderno
  - Información del usuario (nombre, email, username)
  - Lista de funcionalidades de Pritzio
  - Enlaces a redes sociales
  - Branding consistente

### **2. 🔐 Verificación de Email**
- **Método:** `getEmailVerificationTemplate(user, verificationUrl)`
- **Uso:** Verificación de cuenta al registrarse
- **Características:**
  - Botón de verificación prominente
  - Enlace de respaldo
  - Advertencia de expiración (24 horas)
  - Instrucciones claras

### **3. 🔒 Restablecimiento de Contraseña**
- **Método:** `getPasswordResetTemplate(user, resetUrl)`
- **Uso:** Recuperación de contraseña
- **Características:**
  - Botón de restablecimiento
  - Consejos de seguridad
  - Advertencia de expiración (1 hora)
  - Enlace de respaldo

## 🎨 **Características de Diseño**

### **Responsive Design**
- **Mobile-first** approach
- **Breakpoints** para diferentes dispositivos
- **Estilos inline** para compatibilidad con clientes de correo

### **Branding Consistente**
- **Colores:** Azul (#007bff), Verde (#28a745), Rojo (#dc3545)
- **Tipografía:** Segoe UI, Tahoma, Geneva, Verdana
- **Logo y branding** de Pritzio
- **Enlaces a redes sociales**

### **Accesibilidad**
- **Contraste adecuado** de colores
- **Estructura semántica** HTML
- **Alt text** para imágenes
- **Enlaces descriptivos**

## 🔧 **Configuración**

### **Variables de Entorno Requeridas**
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@pritzio.com
FRONTEND_URL=http://localhost:4200
```

### **Inyección de Dependencias**
```typescript
// En el módulo de autenticación
providers: [
  EmailService,
  EmailTemplateService,
  // ... otros servicios
]
```

## 📝 **Uso en el Código**

### **Envío de Correo de Bienvenida**
```typescript
await this.emailService.sendWelcomeEmail({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
});
```

### **Envío de Verificación de Email**
```typescript
const verificationToken = await this.verificationTokenService.generateEmailVerificationToken(user);
await this.emailService.sendEmailVerificationEmail(
  {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  },
  verificationToken.token,
);
```

### **Envío de Restablecimiento de Contraseña**
```typescript
const resetToken = await this.verificationTokenService.generatePasswordResetToken(user);
await this.emailService.sendPasswordResetEmail(
  {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  },
  resetToken.token,
);
```

## 🚀 **Ventajas del Sistema**

### **✅ Seguridad**
- **Datos sensibles protegidos** en el backend
- **Validación centralizada** de contenido
- **Prevención de inyección** de código malicioso
- **Control de acceso** a plantillas

### **✅ Consistencia**
- **Plantillas unificadas** para toda la aplicación
- **Branding consistente** en todos los correos
- **Fácil mantenimiento** desde un solo lugar
- **Versionado controlado** de plantillas

### **✅ Performance**
- **Menos transferencia de datos** entre frontend y backend
- **Procesamiento server-side** más eficiente
- **Caché de plantillas** en el servidor
- **Menos carga en el cliente**

### **✅ Escalabilidad**
- **Fácil internacionalización** (i18n)
- **Personalización por usuario/rol**
- **A/B testing** de plantillas
- **Analytics centralizados**

## 🔄 **Flujo de Trabajo**

### **1. Registro de Usuario**
```
Usuario se registra → AuthService.register() → 
EmailTemplateService.getWelcomeTemplate() → 
EmailService.sendWelcomeEmail() → 
EmailService.sendEmailVerificationEmail()
```

### **2. Verificación de Email**
```
Usuario hace clic en enlace → AuthController.verifyEmail() → 
VerificationTokenService.validateToken() → 
UserRepository.update(emailVerified: true)
```

### **3. Restablecimiento de Contraseña**
```
Usuario solicita reset → AuthController.forgotPassword() → 
EmailTemplateService.getPasswordResetTemplate() → 
EmailService.sendPasswordResetEmail() → 
Usuario hace clic → AuthController.resetPassword()
```

## 📊 **Métricas y Monitoreo**

### **Logs del Sistema**
- **Éxito/fallo** de envío de correos
- **Errores de SMTP** y configuración
- **Tiempo de procesamiento** de plantillas
- **Errores de validación** de tokens

### **Métricas Recomendadas**
- **Tasa de entrega** de correos
- **Tasa de apertura** (con tracking pixels)
- **Tasa de clics** en enlaces
- **Tiempo de respuesta** del servidor SMTP

## 🛠️ **Mantenimiento**

### **Actualización de Plantillas**
1. **Modificar** `EmailTemplateService`
2. **Probar** con datos de ejemplo
3. **Desplegar** a producción
4. **Monitorear** logs de envío

### **Añadir Nuevas Plantillas**
1. **Crear método** en `EmailTemplateService`
2. **Añadir método** en `EmailService`
3. **Actualizar** documentación
4. **Probar** integración

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **Error de SMTP**
```
Error: connect ECONNREFUSED 127.0.0.1:587
```
**Solución:** Verificar configuración SMTP en variables de entorno

#### **Plantilla no se renderiza**
**Solución:** Verificar que `EmailTemplateService` esté inyectado correctamente

#### **Enlaces no funcionan**
**Solución:** Verificar `FRONTEND_URL` en variables de entorno

### **Debugging**
```typescript
// Habilitar logs detallados
this.logger.debug('Sending email:', { to, subject, template });
```

## 📚 **Referencias**

- **Nodemailer Documentation:** https://nodemailer.com/
- **Email HTML Best Practices:** https://www.campaignmonitor.com/dev-resources/
- **Responsive Email Design:** https://www.emailonacid.com/
- **SMTP Configuration:** https://support.google.com/mail/answer/7126229

---

**Última actualización:** 26 de septiembre de 2025  
**Versión:** 1.0.0  
**Autor:** Sistema Pritzio
