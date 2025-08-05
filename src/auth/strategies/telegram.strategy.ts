import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { createHash } from 'crypto';
import { Request } from 'express';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

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
      const telegramData = req.query;

      const isValidSignature = this.verifyTelegramSignature(telegramData);

      if (!isValidSignature) {
        return done(new Error('Invalid Telegram signature'), undefined);
      }

      const authResult = await this.authService.authenticateWithTelegram({
        id: telegramData.id,
        username: telegramData.username || '',
        first_name: telegramData.first_name,
        last_name: telegramData.last_name || '',
        hash: telegramData.hash,
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

    const dataCheckString = Object.keys(userData)
      .sort()
      .map((key) => `${key}=${userData[key as keyof TelegramUserData]}`)
      .join('\n');

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return false;
    }

    const secretKey = createHash('sha256').update(botToken).digest();

    const hmac = createHash('sha256')
      .update(dataCheckString)
      .update(secretKey)
      .digest('hex');

    return hmac === hash;
  }
}
