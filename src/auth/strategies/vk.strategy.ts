import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class VkStrategy extends PassportStrategy(Strategy, 'vkontakte') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      authorizationURL: 'https://oauth.vk.com/authorize',
      tokenURL: 'https://oauth.vk.com/access_token',
      clientID: configService.get<string>('VK_CLIENT_ID') || '',
      clientSecret: configService.get<string>('VK_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('VK_CALLBACK_URL') || '',
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user: any) => void,
  ) {
    try {
      // Получаем данные пользователя из VK API
      const vkUserData = await this.getVkUserData(accessToken);

      // Авторизуем через наш AuthService
      const authResult = await this.authService.authenticateWithVk(vkUserData);
      done(null, authResult);
    } catch (error) {
      done(error, null);
    }
  }

  private getVkUserData(accessToken: string) {
    console.log(accessToken, 'accessToken');

    // Здесь должна быть логика получения данных пользователя из VK API
    // Для демонстрации возвращаем моковые данные
    return Promise.resolve({
      id: '123456789',
      first_name: 'Иван',
      last_name: 'Иванов',
      screen_name: 'ivan_ivanov',
      email: 'ivan@example.com',
    });
  }
}
