import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  getWelcomeTemplate(user: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  }): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a Pritzio!</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #007bff, #0056b3); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300;
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 { 
            color: #007bff; 
            margin-top: 0; 
            font-size: 24px;
          }
          .feature-list { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .feature-list ul { 
            margin: 0; 
            padding-left: 20px; 
          }
          .feature-list li { 
            margin: 8px 0; 
            color: #555; 
          }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: 600;
            transition: background 0.3s;
          }
          .button:hover { 
            background: #0056b3; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef;
          }
          .social-links { 
            margin: 20px 0; 
          }
          .social-links a { 
            color: #007bff; 
            text-decoration: none; 
            margin: 0 10px; 
          }
          @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content { padding: 20px; }
            .header { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido a Pritzio!</h1>
            <p>Tu plataforma de comparación de precios</p>
          </div>
          
          <div class="content">
            <h2>Hola ${user.firstName} ${user.lastName},</h2>
            
            <p>¡Gracias por unirte a Pritzio! Estamos emocionados de tenerte como parte de nuestra comunidad de compradores inteligentes.</p>
            
            <p><strong>Tu cuenta ha sido creada exitosamente:</strong></p>
            <ul>
              <li><strong>Usuario:</strong> ${user.username}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString('es-ES')}</li>
            </ul>

            <div class="feature-list">
              <h3>🚀 ¿Qué puedes hacer con Pritzio?</h3>
              <ul>
                <li>📊 <strong>Comparar precios</strong> entre diferentes tiendas</li>
                <li>🔍 <strong>Buscar productos</strong> de manera inteligente</li>
                <li>💰 <strong>Encontrar las mejores ofertas</strong> del mercado</li>
                <li>🔔 <strong>Recibir alertas</strong> cuando bajen los precios</li>
                <li>📱 <strong>Acceso desde cualquier dispositivo</strong></li>
                <li>🛡️ <strong>Compras seguras</strong> con tiendas verificadas</li>
              </ul>
            </div>

            <p>¡Explora nuestra plataforma y descubre todas las funcionalidades disponibles!</p>
            
            <div style="text-align: center;">
              <a href="${frontendUrl}" class="button">🚀 Ir a Pritzio</a>
            </div>

            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Nuestro equipo de soporte está aquí para ayudarte.</p>
            
            <p>¡Bienvenido al equipo!</p>
            <p><strong>El equipo de Pritzio</strong></p>

            <div class="social-links">
              <p>Síguenos en nuestras redes sociales:</p>
              <a href="#">Facebook</a> | 
              <a href="#">Twitter</a> | 
              <a href="#">Instagram</a> | 
              <a href="#">LinkedIn</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Pritzio. Todos los derechos reservados.</p>
            <p><a href="${frontendUrl}/unsubscribe">Cancelar suscripción</a> | <a href="${frontendUrl}/privacy">Política de Privacidad</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getEmailVerificationTemplate(
    user: { firstName: string; lastName: string },
    verificationUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu correo electrónico</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #28a745, #20c997); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300;
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 { 
            color: #28a745; 
            margin-top: 0; 
            font-size: 24px;
          }
          .verification-box { 
            background: #e8f5e8; 
            border: 2px solid #28a745; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
            text-align: center;
          }
          .button { 
            display: inline-block; 
            background: #28a745; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
          }
          .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
            color: #856404;
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef;
          }
          .link-box { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
            word-break: break-all; 
            font-family: monospace; 
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verifica tu correo electrónico</h1>
            <p>Completa tu registro en Pritzio</p>
          </div>
          
          <div class="content">
            <h2>Hola ${user.firstName} ${user.lastName},</h2>
            
            <p>Gracias por registrarte en Pritzio. Para completar tu registro y activar tu cuenta, necesitamos verificar tu dirección de correo electrónico.</p>
            
            <div class="verification-box">
              <h3>✅ Verificación Requerida</h3>
              <p>Haz clic en el botón de abajo para verificar tu cuenta y comenzar a usar Pritzio:</p>
              
              <a href="${verificationUrl}" class="button">🔐 Verificar mi correo electrónico</a>
            </div>

            <div class="warning">
              <p><strong>⏰ Importante:</strong> Este enlace expirará en 24 horas por seguridad.</p>
            </div>

            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <div class="link-box">${verificationUrl}</div>
            
            <p>Una vez verificado tu correo, podrás:</p>
            <ul>
              <li>✅ Acceder a todas las funcionalidades de Pritzio</li>
              <li>✅ Comparar precios entre tiendas</li>
              <li>✅ Recibir alertas de precios</li>
              <li>✅ Guardar tus productos favoritos</li>
            </ul>

            <p>Si no creaste una cuenta en Pritzio, puedes ignorar este correo de forma segura.</p>
            
            <p>¡Gracias por unirte a nosotros!</p>
            <p><strong>El equipo de Pritzio</strong></p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Pritzio. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(
    user: { firstName: string; lastName: string },
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablece tu contraseña</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #dc3545, #c82333); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300;
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 { 
            color: #dc3545; 
            margin-top: 0; 
            font-size: 24px;
          }
          .reset-box { 
            background: #f8d7da; 
            border: 2px solid #dc3545; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
            text-align: center;
          }
          .button { 
            display: inline-block; 
            background: #dc3545; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
          }
          .warning { 
            background: #f8d7da; 
            border: 1px solid #f5c6cb; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
            color: #721c24;
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef;
          }
          .link-box { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
            word-break: break-all; 
            font-family: monospace; 
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Restablece tu contraseña</h1>
            <p>Solicitud de cambio de contraseña</p>
          </div>
          
          <div class="content">
            <h2>Hola ${user.firstName} ${user.lastName},</h2>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Pritzio.</p>
            
            <div class="reset-box">
              <h3>🔐 Cambio de Contraseña</h3>
              <p>Haz clic en el botón de abajo para crear una nueva contraseña segura:</p>
              
              <a href="${resetUrl}" class="button">🔒 Restablecer mi contraseña</a>
            </div>

            <div class="warning">
              <p><strong>⏰ Importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
            </div>

            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <div class="link-box">${resetUrl}</div>
            
            <p><strong>🔐 Consejos para una contraseña segura:</strong></p>
            <ul>
              <li>✅ Usa al menos 8 caracteres</li>
              <li>✅ Combina letras mayúsculas y minúsculas</li>
              <li>✅ Incluye números y símbolos</li>
              <li>✅ Evita información personal</li>
              <li>✅ No reutilices contraseñas de otras cuentas</li>
            </ul>

            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no será modificada.</p>
            
            <p><strong>🛡️ Por seguridad, nunca compartas este enlace con otras personas.</strong></p>
            
            <p>El equipo de Pritzio</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Pritzio. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
