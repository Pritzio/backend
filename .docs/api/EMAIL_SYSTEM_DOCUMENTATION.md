# 📧 Sistema de Correos Electrónicos - Documentación

*Este documento describe el sistema completo de correos electrónicos implementado en Pritzio Backend, incluyendo configuración, uso y ejemplos.*

*Última actualización: 2025-01-27*
*Versión: 2.1*

## 📋 Tabla de Contenidos

- [Resumen General](#resumen-general)
- [Configuración](#configuración)
- [Servicios Disponibles](#servicios-disponibles)
- [Tipos de Correos](#tipos-de-correos)
- [Tokens de Verificación](#tokens-de-verificación)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Troubleshooting](#troubleshooting)

## 🎯 Resumen General

El sistema de correos electrónicos de Pritzio incluye:

- **Envío automático** de correos de bienvenida
- **Verificación de email** con tokens seguros
- **Reset de contraseña** con enlaces temporales
- **Templates HTML** profesionales y responsivos
- **Configuración flexible** para diferentes proveedores SMTP
- **Manejo de errores** robusto

## ⚙️ Configuración

### Variables de Entorno Requeridas

```bash
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@pritzio.com

# URL del Frontend (para enlaces en correos)
FRONTEND_URL=http://localhost:4200
```

### Configuración para Gmail

1. **Habilitar autenticación de 2 factores** en tu cuenta de Gmail
2. **Generar una contraseña de aplicación**:
   - Ve a Configuración de Google → Seguridad
   - Selecciona "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Correo"
3. **Usar la contraseña de aplicación** en `SMTP_PASS`

### Configuración para otros proveedores

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## 🔧 Servicios Disponibles

### EmailService

Servicio principal para el envío de correos electrónicos.

```typescript
@Injectable()
export class EmailService {
  // Enviar correo personalizado
  async sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<boolean>

  // Correo de bienvenida
  async sendWelcomeEmail(user: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<boolean>

  // Correo de verificación de email
  async sendEmailVerificationEmail(
    user: { email: string; firstName: string; lastName: string },
    verificationToken: string
  ): Promise<boolean>

  // Correo de reset de contraseña
  async sendPasswordResetEmail(
    user: { email: string; firstName: string; lastName: string },
    resetToken: string
  ): Promise<boolean>
}
```

### VerificationTokenService

Servicio para manejo de tokens de verificación.

```typescript
@Injectable()
export class VerificationTokenService {
  // Generar token de verificación de email
  async generateEmailVerificationToken(user: User): Promise<VerificationToken>

  // Generar token de reset de contraseña
  async generatePasswordResetToken(user: User): Promise<VerificationToken>

  // Generar código de verificación de teléfono
  async generatePhoneVerificationCode(user: User, phone: string): Promise<VerificationToken>

  // Validar token
  async validateToken(token: string, type: TokenType): Promise<VerificationToken | null>

  // Marcar token como usado
  async markTokenAsUsed(tokenId: string): Promise<void>

  // Limpiar tokens expirados
  async cleanupExpiredTokens(): Promise<void>
}
```

## 📧 Tipos de Correos

### 1. Correo de Bienvenida

**Cuándo se envía**: Al registrarse un nuevo usuario
**Template**: HTML responsivo con información de bienvenida
**Contenido**:
- Saludo personalizado
- Información de la cuenta creada
- Características de la plataforma
- Enlace para explorar la plataforma

### 2. Verificación de Email

**Cuándo se envía**: Al registrarse un nuevo usuario
**Template**: HTML con botón de verificación
**Contenido**:
- Instrucciones de verificación
- Botón de verificación (expira en 24 horas)
- Enlace alternativo
- Advertencias de seguridad

### 3. Reset de Contraseña

**Cuándo se envía**: Al solicitar reset de contraseña
**Template**: HTML con botón de reset
**Contenido**:
- Instrucciones de reset
- Botón de reset (expira en 1 hora)
- Enlace alternativo
- Advertencias de seguridad

## 🔐 Tokens de Verificación

### Tipos de Tokens

```typescript
enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',    // 24 horas
  PASSWORD_RESET = 'password_reset',            // 1 hora
  PHONE_VERIFICATION = 'phone_verification',    // 10 minutos
}
```

### Características de Seguridad

- **Tokens únicos**: Generados con `crypto.randomBytes(32)`
- **Expiración automática**: Diferentes tiempos según el tipo
- **Uso único**: Los tokens se marcan como usados
- **Limpieza automática**: Tokens expirados se eliminan
- **Validación estricta**: Verificación de tipo y validez

### Estructura de la Base de Datos

```sql
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  phone VARCHAR(255) NULL,
  code VARCHAR(10) NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 💡 Ejemplos de Uso

### Envío de Correo Personalizado

```typescript
// En un servicio
constructor(private readonly emailService: EmailService) {}

async sendCustomEmail() {
  const success = await this.emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Asunto del correo',
    html: '<h1>Contenido HTML</h1><p>Mensaje personalizado</p>',
    text: 'Contenido en texto plano'
  });

  if (success) {
    console.log('Correo enviado exitosamente');
  } else {
    console.error('Error al enviar correo');
  }
}
```

### Verificación de Email en el Controlador

```typescript
@Post('verify-email')
async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
  return this.authService.verifyEmail(verifyEmailDto);
}
```

### Reset de Contraseña

```typescript
@Post('forgot-password')
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  return this.authService.forgotPassword(forgotPasswordDto);
}

@Post('reset-password')
async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  return this.authService.resetPassword(resetPasswordDto);
}
```

## 🎨 Personalización de Templates

### Estructura de Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título del Correo</title>
  <style>
    /* Estilos CSS inline para compatibilidad */
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #007bff; color: white; }
    .button { background: #28a745; color: white; padding: 12px 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Título</h1>
    </div>
    <div class="content">
      <!-- Contenido del correo -->
      <a href="{{link}}" class="button">Botón de Acción</a>
    </div>
    <div class="footer">
      <p>Footer del correo</p>
    </div>
  </div>
</body>
</html>
```

### Variables Disponibles

- `{{firstName}}` - Nombre del usuario
- `{{lastName}}` - Apellido del usuario
- `{{email}}` - Email del usuario
- `{{username}}` - Usuario del usuario
- `{{link}}` - Enlace de verificación/reset
- `{{token}}` - Token de verificación

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Autenticación SMTP

**Síntoma**: `Error: Invalid login: 535-5.7.8 Username and Password not accepted`

**Solución**:
- Verificar que `SMTP_USER` y `SMTP_PASS` sean correctos
- Para Gmail, usar contraseña de aplicación, no la contraseña normal
- Verificar que la autenticación de 2 factores esté habilitada

#### 2. Correos no llegan

**Síntoma**: Los correos se envían pero no llegan al destinatario

**Posibles causas**:
- Revisar carpeta de spam
- Verificar configuración de DNS (SPF, DKIM, DMARC)
- Usar un proveedor SMTP confiable (SendGrid, Mailgun)

#### 3. Error de conexión SMTP

**Síntoma**: `Error: connect ECONNREFUSED`

**Solución**:
- Verificar `SMTP_HOST` y `SMTP_PORT`
- Comprobar conectividad de red
- Verificar firewall/proxy

#### 4. Tokens no válidos

**Síntoma**: `Invalid or expired verification token`

**Solución**:
- Verificar que el token no haya expirado
- Comprobar que el token no haya sido usado
- Verificar que el tipo de token sea correcto

### Logs de Debugging

```typescript
// Habilitar logs detallados
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Habilitar debug
  logger: true, // Habilitar logger
};
```

### Monitoreo de Correos

```typescript
// Verificar estado de envío
const result = await this.emailService.sendEmail(options);
if (result) {
  this.logger.log(`Email sent successfully to ${options.to}`);
} else {
  this.logger.error(`Failed to send email to ${options.to}`);
}
```

## 📊 Métricas y Monitoreo

### Métricas Recomendadas

- **Tasa de entrega**: % de correos entregados exitosamente
- **Tasa de apertura**: % de correos abiertos (requiere tracking)
- **Tasa de clics**: % de enlaces clickeados
- **Tasa de rebote**: % de correos rebotados
- **Tiempo de respuesta**: Tiempo promedio de envío

### Implementación de Tracking

```typescript
// Agregar tracking a enlaces
const trackingUrl = `${baseUrl}/track?token=${token}&action=click`;
const html = template.replace('{{link}}', trackingUrl);
```

## 🔒 Consideraciones de Seguridad

### Mejores Prácticas

1. **Nunca logear tokens** en logs
2. **Limitar intentos** de verificación
3. **Usar HTTPS** para enlaces
4. **Validar tokens** antes de procesar
5. **Limpiar tokens** expirados regularmente

### Rate Limiting

```typescript
// Implementar rate limiting para correos
@Throttle(5, 60) // 5 correos por minuto
async sendPasswordResetEmail() {
  // ...
}
```

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/guides/email-marketing-best-practices/)
- [SMTP Security Guidelines](https://tools.ietf.org/html/rfc5321)

---

*Última actualización: 27 de Enero, 2025*
