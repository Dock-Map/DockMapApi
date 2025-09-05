import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const emailUser =
      this.configService.get<string>('EMAIL_USER') || 'admin@dockmap.ru';

    // Получаем пароль для внешних приложений
    const emailPassword =
      this.configService.get<string>('EMAIL_PASSWORD') || 'j0xpz6kwm2';

    // Удаляем пробелы из пароля
    const cleanPassword = emailPassword.replace(/\s+/g, '');

    const isProduction = process.env.NODE_ENV === 'production';

    // TimeWeb SMTP настройки
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.timeweb.ru',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '465'),
      secure: this.configService.get<string>('SMTP_SECURE') !== 'false', // SSL обязательно
      auth: {
        user: emailUser,
        pass: cleanPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  async sendResetPasswordCode(email: string, code: string): Promise<boolean> {
    console.log(`[EMAIL] Attempting to send reset code to: ${email}`);
    const startTime = Date.now();

    try {
      // Быстрая проверка подключения с таймаутом
      const connectionCheck = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 8 seconds'));
        }, 8000); // 8 секунд максимум на подключение

        this.transporter
          .verify()
          .then(() => {
            clearTimeout(timeout);
            resolve(true);
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

      await connectionCheck;
      console.log(
        `[EMAIL] SMTP connection verified in ${Date.now() - startTime}ms`,
      );

      // TimeWeb SMTP доставляет письма на любые домены:
      // NestJS → TimeWeb SMTP → TimeWeb доставляет → Gmail/Yandex/Outlook/etc
      const mailOptions = {
        from:
          this.configService.get<string>('EMAIL_FROM') ||
          'DockMap <admin@dockmap.ru>',
        to: email, // Может быть любой email: @gmail.com, @yandex.ru, @outlook.com
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

      const sendStartTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.transporter.sendMail(mailOptions);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(
        `[EMAIL] SMTP sent successfully in ${Date.now() - sendStartTime}ms:`,
        result.messageId,
      );
      console.log(`[EMAIL] Total time: ${Date.now() - startTime}ms`);
      return true;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[EMAIL] SMTP failed after ${totalTime}ms:`, error.message);

      // Логируем детали ошибки для диагностики
      if (error.message.includes('550')) {
        console.error(
          `[EMAIL] TimeWeb SMTP error 550 - возможно аккаунт admin@dockmap.ru имеет ограничения`,
        );
        console.log(
          `[EMAIL] Проверьте настройки почтового ящика в панели TimeWeb`,
        );
      }

      console.error(`[EMAIL] TimeWeb SMTP failed: ${error.message}`);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Быстрая проверка с таймаутом
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test connection timeout')), 5000);
      });

      await Promise.race([this.transporter.verify(), timeoutPromise]);

      return true;
    } catch (error) {
      console.error('[EMAIL] Test connection failed:', error.message);
      return false;
    }
  }
}
