import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio;
  private verifyServiceSid: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.configService.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
  }

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      return {
        success: verification.status === 'pending',
        message:
          verification.status === 'pending'
            ? 'Код отправлен'
            : 'Ошибка отправки кода',
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return {
        success: false,
        message: 'Ошибка отправки кода',
      };
    }
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      if (verificationCheck.status === 'approved') {
        return { success: true, message: 'Код подтвержден' };
      } else if (verificationCheck.status === 'pending') {
        return { success: false, message: 'Неверный код' };
      } else {
        return { success: false, message: 'Код истек или недействителен' };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { success: false, message: 'Ошибка проверки кода' };
    }
  }

  // Метод для очистки истекших кодов (можно запускать по расписанию)
  cleanupExpiredCodes(): void {
    console.log('SMS codes cleanup not implemented yet');
  }

  // Только для тестирования - получение кода верификации
  getVerificationCode(): { code: string } | null {
    console.log('SMS codes are not stored in local database');
    return null;
  }
}
