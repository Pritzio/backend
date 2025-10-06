import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/smtp-transport';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP configuration error:', error);
      } else {
        this.logger.log('SMTP server is ready to take our messages');
      }
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    context?: Record<string, any>;
  }): Promise<boolean> {
    try {
      const mailOptions: MailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@pritzio.cl'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}: ${result.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(user: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<boolean> {
    const subject = '¡Bienvenido a Pritzio!';
    const html = this.emailTemplateService.getWelcomeTemplate({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
    });

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendEmailVerificationEmail(
    user: {
      email: string;
      firstName: string;
      lastName: string;
    },
    verificationToken: string,
  ): Promise<boolean> {
    const subject = 'Verifica tu dirección de correo electrónico';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const html = this.emailTemplateService.getEmailVerificationTemplate(
      user,
      verificationUrl,
    );

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(
    user: {
      email: string;
      firstName: string;
      lastName: string;
    },
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Restablece tu contraseña';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = this.emailTemplateService.getPasswordResetTemplate(
      user,
      resetUrl,
    );

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }
}
