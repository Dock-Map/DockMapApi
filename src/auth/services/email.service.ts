import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Настройка транспорта для Gmail (можно заменить на другой провайдер)
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER') || 'your_email@gmail.com',
        pass: this.configService.get<string>('EMAIL_PASSWORD') || 'your_app_password',
      },
    });
  }

  async sendResetPasswordCode(email: string, code: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM') || 'DockMap <noreply@dockmap.com>',
        to: email,
        subject: 'Сброс пароля DockMap',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">DockMap</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Сброс пароля</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                Вы запросили сброс пароля для вашего аккаунта DockMap.
              </p>
              
              <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #cbd5e1;">
                <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Ваш код подтверждения:</p>
                <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  ⚠️ <strong>Важно:</strong> Код действителен в течение 10 минут
                </p>
              </div>
              
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
              <p>© 2024 DockMap. Все права защищены.</p>
            </div>
          </div>
        `,
        text: `
DockMap - Сброс пароля

Вы запросили сброс пароля для вашего аккаунта DockMap.

Ваш код подтверждения: ${code}

Код действителен в течение 10 минут.

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

© 2024 DockMap
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}
