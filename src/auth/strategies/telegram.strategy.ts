import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { createHash } from 'crypto';
import { Request } from 'express';

// Интерфейс для данных от Telegram Login Widget
interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Интерфейс для данных пользователя без hash
interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

// Интерфейс для запроса с Telegram данными
interface TelegramRequest extends Request {
  query: TelegramAuthData & Record<string, any>;
}

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
  }

  async validate(
    req: TelegramRequest,
    done: (error: any, user?: AuthResponseDto) => void,
  ): Promise<void> {
    try {
      // Получаем данные от Telegram Login Widget
      const telegramData = req.query;

      // Проверяем подпись от Telegram
      const isValidSignature = this.verifyTelegramSignature(telegramData);

      if (!isValidSignature) {
        return done(new Error('Invalid Telegram signature'), undefined);
      }

      // Авторизуем через наш AuthService
      const authResult = await this.authService.authenticateWithTelegram({
        id: telegramData.id,
        username: telegramData.username || '',
        first_name: telegramData.first_name,
        last_name: telegramData.last_name || '',
      });

      done(null, authResult);
    } catch (error) {
      done(error, undefined);
    }
  }

  private verifyTelegramSignature(data: TelegramAuthData): boolean {
    const { hash, ...userData } = data;

    if (!hash) {
      return false;
    }

    // Создаем строку для проверки подписи
    const dataCheckString = Object.keys(userData)
      .sort()
      .map((key) => `${key}=${userData[key as keyof TelegramUserData]}`)
      .join('\n');

    // Создаем секретный ключ
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return false;
    }

    const secretKey = createHash('sha256').update(botToken).digest();

    // Вычисляем HMAC
    const hmac = createHash('sha256')
      .update(dataCheckString)
      .update(secretKey)
      .digest('hex');

    return hmac === hash;
  }
}
