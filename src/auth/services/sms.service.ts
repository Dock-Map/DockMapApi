import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationCode } from '../entities/verification-code.entity';
import * as smsRu from 'sms_ru';

interface SmsRuApiResult {
  status: string;
  balance?: number;
  sms?: Record<string, { status: string; status_text: string }>;
  code?: string;
  description?: string;
}

interface SmsRuClient {
  sms_send: (
    params: any,
    callback: (error: any, result: SmsRuApiResult) => void,
  ) => void;
  my_balance: (
    params: any,
    callback: (error: any, result: SmsRuApiResult) => void,
  ) => void;
  sms_status: (
    params: any,
    callback: (error: any, result: SmsRuApiResult) => void,
  ) => void;
}

@Injectable()
export class SmsService {
  private smsClient: SmsRuClient;
  private apiId: string;
  private from: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
  ) {
    this.apiId = this.configService.get<string>('SMS_RU_API_ID') || '';
    this.from = this.configService.get<string>('SMS_RU_FROM') || '';

    if (!this.apiId) {
      throw new Error('SMS.RU API ID not configured');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.smsClient = new smsRu(this.apiId) as SmsRuClient;
  }

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Проверяем и форматируем номер телефона
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!this.validatePhoneNumber(formattedPhone)) {
        return {
          success: false,
          message:
            'Неверный формат номера телефона. Используйте формат: +7XXXXXXXXXX или +375XXXXXXXXX',
        };
      }

      // Генерируем код верификации
      const code = this.generateVerificationCode();

      // Формируем текст сообщения
      const message = `Ваш код подтверждения: ${code}`;

      // Проверяем режим тестирования
      const isTestMode =
        this.configService.get<string>('NODE_ENV') === 'development' &&
        this.configService.get<string>('SMS_TEST_MODE') === 'true';

      if (isTestMode) {
        // Сохраняем код в базу данных даже в тестовом режиме
        const verificationCode = this.verificationCodeRepository.create({
          phoneNumber: formattedPhone,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
          isUsed: false,
        });

        await this.verificationCodeRepository.save(verificationCode);

        return {
          success: true,
          message: `Код отправлен (тестовый режим): ${code}`,
        };
      }

      // Сохраняем код в базу данных перед отправкой
      const verificationCode = this.verificationCodeRepository.create({
        phoneNumber: formattedPhone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
        isUsed: false,
      });

      await this.verificationCodeRepository.save(verificationCode);

      // Отправляем SMS через SMS.RU API используя callback
      const result = await this.promisifySmsRuCall(this.smsClient.sms_send, {
        to: formattedPhone,
        text: message,
        from: this.from,
      });

      if (result.status === 'OK') {
        return {
          success: true,
          message: 'Код отправлен',
        };
      } else {
        // Обрабатываем различные ошибки SMS.RU
        let errorMessage = 'Ошибка отправки кода';

        if (result.code === '201') {
          errorMessage = 'Недостаточно средств на балансе SMS.RU';
        } else if (result.code === '202') {
          errorMessage = 'Неправильный логин или пароль';
        } else if (result.code === '203') {
          errorMessage = 'Недостаточно средств на лицевом счете';
        } else if (result.code === '204') {
          errorMessage = 'IP-адрес временно заблокирован';
        } else if (result.code === '205') {
          errorMessage = 'Неверный формат номера телефона';
        } else if (result.code === '206') {
          errorMessage =
            'Сообщение запрещено (по тексту или по имени отправителя)';
        } else if (result.code === '207') {
          errorMessage =
            'На этот номер нельзя отправлять сообщения (номер в стоп-листе или не поддерживается)';
        } else if (result.code === '208') {
          errorMessage =
            'Сообщение на указанный номер не может быть доставлено';
        } else if (result.code === '209') {
          errorMessage =
            'Отправка более одного одинакового запроса на передачу SMS-кода в течение минуты';
        } else if (result.code === '210') {
          errorMessage = 'Используется GET, где необходимо использовать POST';
        } else if (result.code === '211') {
          errorMessage = 'Метод не найден';
        } else if (result.code === '212') {
          errorMessage =
            'Текст сообщения необходимо передать в кодировке UTF-8';
        } else if (result.code === '220') {
          errorMessage = 'Сервис временно недоступен, попробуйте чуть позже';
        } else if (result.code === '230') {
          errorMessage =
            'Сообщение не принято к отправке, так как на один номер в день нельзя отправлять более 100 сообщений';
        } else if (result.code === '300') {
          errorMessage =
            'Неправильный token (возможно, истек срок действия токена авторизации)';
        } else if (result.code === '301') {
          errorMessage = 'Неправильный api_id';
        } else if (result.code === '302') {
          errorMessage =
            'IP-адрес, с которого выполняется запрос, не найден в списке разрешенных';
        } else if (result.description) {
          errorMessage = result.description;
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ошибка отправки кода';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Форматируем номер телефона для поиска
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Ищем код в базе данных
      const verificationCode = await this.verificationCodeRepository.findOne({
        where: {
          phoneNumber: formattedPhone,
          code,
          isUsed: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      if (!verificationCode) {
        return { success: false, message: 'Неверный код' };
      }

      // Проверяем, не истек ли код
      if (verificationCode.expiresAt < new Date()) {
        return { success: false, message: 'Код истек' };
      }

      // Помечаем код как использованный
      verificationCode.isUsed = true;
      await this.verificationCodeRepository.save(verificationCode);

      return { success: true, message: 'Код подтвержден' };
    } catch {
      return { success: false, message: 'Ошибка проверки кода' };
    }
  }

  // Метод для очистки истекших кодов
  async cleanupExpiredCodes(): Promise<void> {
    try {
      await this.verificationCodeRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now: new Date() })
        .execute();
    } catch {
      // Ошибка очистки истекших кодов
    }
  }

  // Только для тестирования - получение кода верификации
  async getVerificationCode(
    phoneNumber: string,
  ): Promise<{ code: string } | null> {
    try {
      // Форматируем номер телефона для поиска
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const verificationCode = await this.verificationCodeRepository.findOne({
        where: {
          phoneNumber: formattedPhone,
          isUsed: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      if (verificationCode && verificationCode.expiresAt > new Date()) {
        return { code: verificationCode.code };
      }

      return null;
    } catch {
      return null;
    }
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Метод для проверки номера телефона
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Убираем все нецифровые символы
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Проверяем, что номер начинается с 7 или 375 (Россия/Беларусь)
    if (cleanNumber.startsWith('7') && cleanNumber.length === 11) {
      return true;
    }

    if (cleanNumber.startsWith('375') && cleanNumber.length === 12) {
      return true;
    }

    return false;
  }

  // Метод для форматирования номера телефона
  public formatPhoneNumber(phoneNumber: string): string {
    // Убираем все нецифровые символы
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Если номер начинается с 8, заменяем на 7
    if (cleanNumber.startsWith('8') && cleanNumber.length === 11) {
      return '7' + cleanNumber.slice(1);
    }

    return cleanNumber;
  }

  // Вспомогательный метод для преобразования callback в Promise
  private promisifySmsRuCall(
    method: (
      params: any,
      callback: (error: any, result: SmsRuApiResult) => void,
    ) => void,
    params: any,
  ): Promise<SmsRuApiResult> {
    return new Promise((resolve, reject) => {
      method(params, (error: any, result: SmsRuApiResult) => {
        if (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'SMS.RU API error';
          reject(new Error(errorMsg));
        } else {
          resolve(result);
        }
      });
    });
  }

  // Метод для проверки баланса SMS.RU
  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const result = await this.promisifySmsRuCall(
        this.smsClient.my_balance,
        {},
      );

      if (result.status === 'OK' && result.balance !== undefined) {
        return {
          balance: result.balance,
          currency: 'RUB',
        };
      } else {
        throw new Error('Failed to get balance');
      }
    } catch {
      throw new Error('Ошибка получения баланса');
    }
  }

  // Метод для проверки статуса отправки
  async getSmsStatus(
    smsId: string,
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await this.promisifySmsRuCall(this.smsClient.sms_status, {
        id: smsId,
      });

      if (result.status === 'OK' && result.sms && result.sms[smsId]) {
        const smsInfo = result.sms[smsId];
        return {
          status: smsInfo.status,
          message: smsInfo.status_text,
        };
      } else {
        throw new Error('Failed to get SMS status');
      }
    } catch {
      throw new Error('Ошибка получения статуса SMS');
    }
  }
}
