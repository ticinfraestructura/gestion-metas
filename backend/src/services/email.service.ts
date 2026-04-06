import nodemailer from 'nodemailer';
import { EmailError } from '@/shared/errors';
import { logInfo, logError } from '@/utils/logger';

/**
 * Servicio de email
 * Implementa envío de emails usando nodemailer con templates HTML
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Para desarrollo, remover en producción
      }
    });

    // Verificar conexión
    this.verifyConnection();
  }

  /**
   * Verificar conexión con el servidor de email
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logInfo('Email service connection verified');
    } catch (error) {
      logError('Email service connection failed', error);
    }
  }

  /**
   * Enviar email genérico
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Gestión Metas" <noreply@gestionmetas.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      logInfo(`Email sent: ${info.messageId}`, { to: options.to, subject: options.subject });
    } catch (error) {
      logError('Failed to send email', error);
      throw new EmailError(`Failed to send email: ${(error as Error).message}`);
    }
  }

  /**
   * Enviar email de validación
   */
  async sendValidationEmail(email: string, token: string): Promise<void> {
    const validationUrl = `${process.env.FRONTEND_URL}/validate-email?token=${token}`;
    
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Valida tu Email - Gestión Metas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Bienvenido a Gestión de Metas</h1>
        </div>
        <div class="content">
          <p>¡Hola!</p>
          <p>Gracias por registrarte en nuestra plataforma de Gestión de Metas y Contratistas. Para activar tu cuenta, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="${validationUrl}" class="button">Validar Email</a>
          </div>
          
          <div class="warning">
            <strong>Importante:</strong> Este enlace expirará en 24 horas. Si no lo usas en ese tiempo, deberás solicitar un nuevo email de validación.
          </div>
          
          <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${validationUrl}</p>
          
          <p>Si no te registraste en nuestra plataforma, puedes ignorar este email de forma segura.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Gestión Metas. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🔔 Valida tu email - Gestión Metas',
      html: template,
      text: `Hola! Gracias por registrarte en Gestión Metas. Para activar tu cuenta, visita: ${validationUrl}`
    });
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - Gestión Metas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #dc3545;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background: #dc3545;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔒 Recuperación de Contraseña</h1>
        </div>
        <div class="content">
          <p>¡Hola!</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Gestión Metas.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          
          <div class="warning">
            <strong>Importante:</strong> Este enlace expirará en 1 hora por seguridad. Si no lo usas en ese tiempo, deberás solicitar un nuevo enlace de recuperación.
          </div>
          
          <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
          
          <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña actual seguirá siendo válida.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Gestión Metas. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🔐 Recuperación de Contraseña - Gestión Metas',
      html: template,
      text: `Hola! Solicitaste restablecer tu contraseña. Visita: ${resetUrl}`
    });
  }

  /**
   * Enviar email de notificación general
   */
  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject} - Gestión Metas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #28a745;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📢 ${subject}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Gestión Metas. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `${subject} - Gestión Metas`,
      html: template,
      text: message
    });
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(email: string, nombre: string): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido - Gestión Metas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .feature {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Bienvenido, ${nombre}!</h1>
        </div>
        <div class="content">
          <p>¡Nos complace tenerte a bordo de Gestión Metas!</p>
          <p>A partir de ahora podrás:</p>
          
          <div class="feature">
            <strong>🎯 Gestionar Metas</strong><br>
            Crear, editar y seguimiento de metas organizacionales
          </div>
          
          <div class="feature">
            <strong>👥 Administrar Contratistas</strong><br>
            Mantener un registro actualizado de todos tus contratistas
          </div>
          
          <div class="feature">
            <strong>📊 Reportar Avances</strong><br>
            Documentar el progreso de tus proyectos en tiempo real
          </div>
          
          <div class="feature">
            <strong>📈 Dashboard Analítico</strong><br>
            Visualizar KPIs y generar reportes detallados
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Gestión Metas. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎉 ¡Bienvenido a Gestión Metas!',
      html: template,
      text: `¡Hola ${nombre}! Bienvenido a Gestión Metas. Estamos emocionados de tenerte con nosotros.`
    });
  }
}
