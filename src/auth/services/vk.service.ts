import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface VkTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  email?: string;
}

interface VkUserData {
  id: string;
  first_name: string;
  last_name: string;
  screen_name?: string;
  email?: string;
}

@Injectable()
export class VkService {
  constructor(private configService: ConfigService) {}

  /**
   * Обменивает код авторизации на access token
   */
  async exchangeCodeForToken(code: string): Promise<VkTokenResponse> {
    const clientId = this.configService.get<string>('VK_CLIENT_ID');

    if (!clientId) {
      throw new UnauthorizedException('VK конфигурация не настроена');
    }

    try {
      const response = await axios.get('https://oauth.vk.com/access_token', {
        params: {
          client_id: clientId,
          code: code,
        },
      });

      console.log(response.data, 'VK token response');

      return response.data as VkTokenResponse;
    } catch {
      throw new UnauthorizedException('Не удалось получить токен от VK');
    }
  }

  /**
   * Получает данные пользователя из VK API
   */
  async getUserData(accessToken: string): Promise<VkUserData> {
    try {
      const response = await axios.get<VkUserData>(
        'https://api.vk.com/method/users.get',
        {
          params: {
            access_token: accessToken,
            v: '5.131', // Версия VK API
            fields: 'screen_name,email',
          },
        },
      );

      console.log(response.data, 'VK user data response');

      return response.data;
    } catch {
      throw new UnauthorizedException(
        'Не удалось получить данные пользователя из VK',
      );
    }
  }

  /**
   * Полный процесс авторизации через VK
   */
  async authenticateWithCode(code: string): Promise<VkUserData> {
    const tokenData = await this.exchangeCodeForToken(code);

    const userData = await this.getUserData(tokenData.access_token);

    console.log(userData, 'VK user data');

    if (tokenData.email) {
      userData.email = tokenData.email;
    }

    return userData;
  }
}
