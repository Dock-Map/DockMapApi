import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { createHash, createHmac } from 'crypto';
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
      const tgAuthResult = req.query.tgAuthResult as string;
      console.log(tgAuthResult, 'tgAuthResult');
      if (!tgAuthResult) {
        return done(new Error('Missing tgAuthResult parameter'), undefined);
      }

      const base64Data = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');

      const userData = JSON.parse(jsonStr) as {
        id: number;
        first_name: string;
        last_name: string;
        username: string;
        auth_date: number;
        hash: string;
      };

      const telegramData = userData;

      console.log(telegramData, 'telegramData');
      const isValidSignature = this.verifyTelegramSignature(telegramData);
      console.log(isValidSignature, 'isValidSignature');

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

      console.log(authResult, 'authResult');
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

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return false;
    }

    const secret = createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(userData)
      .sort()
      .map((k) => `${k}=${userData[k]}`)
      .join('\n');
    const hmac = createHmac('sha256', secret).update(checkString).digest('hex');
    return hmac === hash;
  }
}
