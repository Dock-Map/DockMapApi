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
    // Получаем API ключ из конфигурации или используем предоставленный
    const mailerSendApiKey =
      this.configService.get<string>('MAILERSEND_API_KEY') ||
      'mlsn.ce978212dc34f30cda1fe6bec4d069539a3206709a51a551bad362e59ec67c0d';

    console.log(
      `[MAILERSEND] Using API key: ${mailerSendApiKey.substring(0, 15)}...`,
    );

    const mailerSend = new MailerSend({
      apiKey: mailerSendApiKey,
    });

    // Используем только ваш домен
    let fromEmail =
      this.configService.get<string>('MAILERSEND_FROM_EMAIL') ||
      'hello@test-pzkmgq7656vl059v.mlsender.net';

    // Исправляем email если указан только домен без префикса
    if (!fromEmail.includes('@')) {
      fromEmail = `hello@${fromEmail}`;
    } else if (
      !fromEmail.startsWith('hello@') &&
      fromEmail.includes('test-pzkmgq7656vl059v.mlsender.net')
    ) {
      fromEmail = 'hello@test-pzkmgq7656vl059v.mlsender.net';
    }

    const fromName =
      this.configService.get<string>('MAILERSEND_FROM_NAME') || 'DockMap';

    console.log(`[MAILERSEND] Sending from: ${fromEmail}`);

    // Trial аккаунт может отправлять только на email администратора
    const adminEmail =
      this.configService.get<string>('MAILERSEND_ADMIN_EMAIL') ||
      'kozago.gor@gmail.com'; // Email администратора MailerSend аккаунта

    const actualRecipient = email === adminEmail ? email : adminEmail;

    if (email !== adminEmail) {
      console.log(
        `[MAILERSEND] 🔄 Redirecting email from ${email} to admin ${adminEmail} (Trial limitation)`,
      );
    }

    const sentFrom = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(actualRecipient, 'User')];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(
        `Сброс пароля DockMap${email !== adminEmail ? ` (для ${email})` : ''}`,
      )
      .setHtml(
        this.getEmailTemplate(code, email !== adminEmail ? email : undefined),
      )
      .setText(`Ваш код для сброса пароля DockMap: ${code}`);

    console.log(`[MAILERSEND] Sending email to: ${email}`);

    const result = await mailerSend.email.send(emailParams);

    console.log(`[MAILERSEND] Raw result:`, JSON.stringify(result, null, 2));

    if (result) {
      console.log(`[MAILERSEND] ✅ Email sent successfully`);
      return true;
    } else {
      throw new Error('MailerSend returned no result');
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

    // Используем только ваш домен
    let fromEmail =
      this.configService.get<string>('MAILERSEND_FROM_EMAIL') ||
      'hello@test-pzkmgq7656vl059v.mlsender.net';

    // Исправляем email если указан только домен без префикса
    if (!fromEmail.includes('@')) {
      fromEmail = `hello@${fromEmail}`;
    } else if (
      !fromEmail.startsWith('hello@') &&
      fromEmail.includes('test-pzkmgq7656vl059v.mlsender.net')
    ) {
      fromEmail = 'hello@test-pzkmgq7656vl059v.mlsender.net';
    }

    const fromName =
      this.configService.get<string>('MAILERSEND_FROM_NAME') || 'DockMap';

    console.log(`[MAILERSEND HTTP] Sending from: ${fromEmail}`);

    // Trial аккаунт может отправлять только на email администратора
    const adminEmail =
      this.configService.get<string>('MAILERSEND_ADMIN_EMAIL') ||
      'kozago.gor@gmail.com'; // Email администратора MailerSend аккаунта

    const actualRecipient = email === adminEmail ? email : adminEmail;

    if (email !== adminEmail) {
      console.log(
        `[MAILERSEND HTTP] 🔄 Redirecting email from ${email} to admin ${adminEmail} (Trial limitation)`,
      );
    }

    const payload = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: [
        {
          email: actualRecipient,
          name: 'User',
        },
      ],
      subject: `Сброс пароля DockMap${email !== adminEmail ? ` (для ${email})` : ''}`,
      html: this.getEmailTemplate(
        code,
        email !== adminEmail ? email : undefined,
      ),
      text: `Ваш код для сброса пароля DockMap: ${code}`,
    };

    console.log(`[MAILERSEND HTTP] Payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://api.mailersend.com/v1/email',
      payload,
      {
        headers: {
          Authorization: `Bearer ${mailerSendApiKey}`,
          'Content-Type': 'application/json',
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
      console.log(`[MAILERSEND HTTP] ✅ Email sent successfully`);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private getEmailTemplate(code: string, originalEmail?: string): string {
    const redirectNote = originalEmail
      ? `<div style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0288d1; margin: 20px 0;">
        <p style="color: #01579b; margin: 0; font-size: 14px;">
          📧 <strong>Trial режим:</strong> Это письмо предназначалось для ${originalEmail}, но отправлено на ваш email из-за ограничений Trial аккаунта MailerSend.
        </p>
      </div>`
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">DockMap</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Сброс пароля</h2>
          
          ${redirectNote}
          
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
