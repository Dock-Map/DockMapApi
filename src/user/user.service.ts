import { Injectable } from '@nestjs/common';
import { SmsService } from '../shared/services/sms.service';

@Injectable()
export class UserService {
  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();

  constructor(private readonly smsService: SmsService) {}

  create() {
    return 'This action adds a new user';
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    const code = this.smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    this.verificationCodes.set(phoneNumber, { code, expiresAt });

    const success = await this.smsService.sendVerificationCode(
      phoneNumber,
      code,
    );

    return {
      success,
      message: success ? 'Код отправлен' : 'Ошибка отправки кода',
    };
  }

  verifyCode(
    phoneNumber: string,
    code: string,
  ): { success: boolean; message: string } {
    const storedData = this.verificationCodes.get(phoneNumber);

    if (!storedData) {
      return { success: false, message: 'Код не найден' };
    }

    if (new Date() > storedData.expiresAt) {
      this.verificationCodes.delete(phoneNumber);
      return { success: false, message: 'Код истек' };
    }

    if (storedData.code !== code) {
      return { success: false, message: 'Неверный код' };
    }

    this.verificationCodes.delete(phoneNumber);
    return { success: true, message: 'Код подтвержден' };
  }
}
