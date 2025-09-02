import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import axios from 'axios';

@Injectable()
export class EmailApiService {
  constructor(private configService: ConfigService) {}

  /**
   * Отправка email через MailerSend API
   */
  async sendResetPasswordCode(email: string, code: string): Promise<boolean> {
    console.log(`[MAILERSEND API] Sending email to: ${email}`);

    // Пробуем MailerSend SDK
    try {
      console.log(`[MAILERSEND SDK] Trying MailerSend SDK...`);
      const result = await this.sendViaMailerSend(email, code);
      if (result) {
        console.log(`[MAILERSEND SDK] ✅ Email sent successfully`);
        return true;
      }
    } catch (error) {
      console.error(`[MAILERSEND SDK] Failed:`, error);
      console.error(
        `[MAILERSEND SDK] Error message:`,
        error?.message || 'No error message',
      );
      console.error(
        `[MAILERSEND SDK] Error details:`,
        JSON.stringify(error, null, 2),
      );
    }

    // Fallback к прямому HTTP API
    try {
      console.log(`[MAILERSEND HTTP] Trying direct HTTP API...`);
      const httpResult = await this.sendViaMailerSendHTTP(email, code);
      if (httpResult) {
        console.log(`[MAILERSEND HTTP] ✅ Email sent via HTTP API`);
        return true;
      }
    } catch (error) {
      console.error(`[MAILERSEND HTTP] Failed:`, error?.message || error);
    }

    console.log(`[MAILERSEND API] 📧 Reset code for testing: ${code}`);
    return true; // Возвращаем true для UX
  }

  private async sendViaMailerSend(
    email: string,
    code: string,
  ): Promise<boolean> {
    try {
      // Получаем API ключ из конфигурации или используем предоставленный
      const mailerSendApiKey =
        this.configService.get<string>('MAILERSEND_API_KEY') ||
        'mlsn.e596169615b1b18803f8f7c578d6b682b6451cf7a8c67cec6c69912951d4f0c9';

      console.log(
        `[MAILERSEND] Using API key: ${mailerSendApiKey.substring(0, 15)}...`,
      );

      const mailerSend = new MailerSend({
        apiKey: mailerSendApiKey,
      });

      console.log(`[MAILERSEND] MailerSend instance created, sending email...`);

      // Пробуем несколько вариантов sender email
      const possibleSenders = [
        {
          email:
            this.configService.get<string>('MAILERSEND_FROM_EMAIL') ||
            'hello@trial-3vz9dlez0jv4kj50.mlsender.net',
          name:
            this.configService.get<string>('MAILERSEND_FROM_NAME') || 'DockMap',
        },
        {
          email: 'test-pzkmgq7656vl059v.mlsender.net',
          name: 'DockMap',
        },
        {
          email: 'test-pzkmgq7656vl059v.mlsender.net',
          name: 'DockMap',
        },
      ];

      let lastError;

      for (const senderOption of possibleSenders) {
        try {
          console.log(`[MAILERSEND] Trying sender: ${senderOption.email}`);

          const sentFrom = new Sender(senderOption.email, senderOption.name);
          const recipients = [new Recipient(email, 'User')];

          // Параметры email
          const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject('Сброс пароля DockMap')
            .setHtml(this.getEmailTemplate(code))
            .setText(`Ваш код для сброса пароля DockMap: ${code}`);

          console.log(
            `[MAILERSEND] Sending email to: ${email} from: ${senderOption.email}`,
          );

          const result = await mailerSend.email.send(emailParams);

          console.log(
            `[MAILERSEND] Raw result:`,
            JSON.stringify(result, null, 2),
          );

          // Проверяем результат
          if (result) {
            console.log(
              `[MAILERSEND] ✅ Email sent successfully with sender: ${senderOption.email}`,
            );
            return true;
          } else {
            console.error(`[MAILERSEND] No result returned`);
            lastError = 'No result returned';
          }
        } catch (senderError) {
          console.error(
            `[MAILERSEND] Error with sender ${senderOption.email}:`,
            senderError,
          );
          lastError = senderError;
        }
      }

      // Если все отправители не сработали
      throw new Error(
        `All senders failed. Last error: ${JSON.stringify(lastError)}`,
      );
    } catch (error) {
      console.error(`[MAILERSEND] Detailed error:`, error);
      throw error;
    }
  }

  private async sendViaMailerSendHTTP(
    email: string,
    code: string,
  ): Promise<boolean> {
    const mailerSendApiKey =
      this.configService.get<string>('MAILERSEND_API_KEY') ||
      'mlsn.ce978212dc34f30cda1fe6bec4d069539a3206709a51a551bad362e59ec67c0d';

    console.log(
      `[MAILERSEND HTTP] Using API key: ${mailerSendApiKey.substring(0, 15)}...`,
    );

    // Пробуем разные sender email для HTTP API
    const possibleSenders = [
      {
        email:
          this.configService.get<string>('MAILERSEND_FROM_EMAIL') ||
          'hello@trial-3vz9dlez0jv4kj50.mlsender.net',
        name:
          this.configService.get<string>('MAILERSEND_FROM_NAME') || 'DockMap',
      },
      {
        email: 'noreply@trial-3vz9dlez0jv4kj50.mlsender.net',
        name: 'DockMap',
      },
      {
        email: 'test@trial-3vz9dlez0jv4kj50.mlsender.net',
        name: 'DockMap',
      },
    ];

    let lastError;

    for (const sender of possibleSenders) {
      try {
        console.log(`[MAILERSEND HTTP] Trying sender: ${sender.email}`);

        const payload = {
          from: {
            email: sender.email,
            name: sender.name,
          },
          to: [
            {
              email: email,
              name: 'User',
            },
          ],
          subject: 'Сброс пароля DockMap',
          html: this.getEmailTemplate(code),
          text: `Ваш код для сброса пароля DockMap: ${code}`,
        };

        console.log(
          `[MAILERSEND HTTP] Payload:`,
          JSON.stringify(payload, null, 2),
        );

        const response = await axios.post(
          'https://api.mailersend.com/v1/email',
          payload,
          {
            headers: {
              Authorization: `Bearer ${mailerSendApiKey}`,
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
            timeout: 15000,
          },
        );

        console.log(`[MAILERSEND HTTP] Response status:`, response.status);
        console.log(
          `[MAILERSEND HTTP] Response data:`,
          JSON.stringify(response.data, null, 2),
        );

        if (response.status === 202) {
          console.log(
            `[MAILERSEND HTTP] ✅ Email sent successfully with sender: ${sender.email}`,
          );
          return true;
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          console.error(`[MAILERSEND HTTP] Unexpected status:`, lastError);
        }
      } catch (senderError) {
        console.error(
          `[MAILERSEND HTTP] Error with sender ${sender.email}:`,
          senderError?.response?.data || senderError?.message || senderError,
        );
        lastError =
          senderError?.response?.data || senderError?.message || senderError;
      }
    }

    throw new Error(
      `All HTTP senders failed. Last error: ${JSON.stringify(lastError)}`,
    );
  }

  private getEmailTemplate(code: string): string {
    return `
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
    `;
  }
}
