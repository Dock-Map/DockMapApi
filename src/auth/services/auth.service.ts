import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { TokenService } from './token.service';
import { UserService } from '../../user/user.service';
import { AuthProvider, User } from '../../user/entities/user.entity';
import { UserRole } from '../../shared/types/user.role';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { SmsService } from './sms.service';
import { ConfigService } from '@nestjs/config';
import { VkService } from './vk.service';

interface TelegramAuthData {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: string;
  hash: string;
}

// Интерфейс для данных VK (соответствует VkAuthDto)
interface VkAuthData {
  id: string;
  first_name: string;
  last_name: string;
  screen_name?: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private smsService: SmsService,
    private configService: ConfigService,
    private vkService: VkService,
  ) {}

  // Универсальная авторизация через SMS
  async authenticateWithSms(
    phone: string,
    code: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    // Проверка SMS кода
    const verificationResult = await this.smsService.verifyCode(phone, code);
    if (!verificationResult.success) {
      throw new UnauthorizedException(verificationResult.message);
    }

    // Получаем отформатированный номер из SMS сервиса
    const formattedPhone = this.smsService.formatPhoneNumber(phone);

    let user = await this.userService.findByPhone(formattedPhone);

    if (!user) {
      // Создаем нового пользователя без роли (пользователь выберет позже)
      user = await this.userService.create({
        phone: formattedPhone,
        name: `User_${formattedPhone.slice(-4)}`,
        authProvider: AuthProvider.SMS,
        isPhoneVerified: true,
        // role не устанавливаем - пользователь выберет при завершении регистрации
      });
    } else {
      // Обновляем статус верификации
      await this.userService.updatePhoneVerification(user.id, true);
    }

    // Обновляем информацию о входе
    if (ipAddress) {
      await this.userService.updateLastLogin(user.id, ipAddress);
    }

    return this.generateAuthTokens(user);
  }

  getTelegramOauthLink() {
    const botId = this.configService.get<string>('TELEGRAM_BOT_ID');
    const origin = this.configService.get<string>('TELEGRAM_BOT_ORIGIN');
    const return_to = this.configService.get<string>('TELEGRAM_REDIRECT_URL');
    return `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&return_to=${return_to}`;
  }

  async authenticateWithTelegram(
    telegramData: TelegramAuthData,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { id, username, first_name, last_name } = telegramData;

    let user = await this.userService.findByTelegramId(id.toString());

    if (!user) {
      user = await this.userService.create({
        name: `${first_name} ${last_name || ''}`.trim(),
        phone: `telegram_${id}`,
        authProvider: AuthProvider.TELEGRAM,
        providerId: id.toString(),
        telegramUsername: username,
        role: UserRole.OWNER,
      });
    }

    if (ipAddress) {
      await this.userService.updateLastLogin(user.id, ipAddress);
    }

    return this.generateAuthTokens(user);
  }

  // Авторизация через VK
  async authenticateWithVk(
    vkData: VkAuthData,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { id, first_name, last_name, email } = vkData;

    let user = await this.userService.findByVkId(id);

    if (!user) {
      user = await this.userService.create({
        name: `${first_name} ${last_name}`.trim(),
        phone: `vk_${id}`, // Временный номер для VK
        email,
        authProvider: AuthProvider.VK,
        providerId: id,
        vkId: id,
        role: UserRole.OWNER,
      });
    }

    // Обновляем информацию о входе
    if (ipAddress) {
      await this.userService.updateLastLogin(user.id, ipAddress);
    }

    return this.generateAuthTokens(user);
  }

  // Авторизация через VK callback
  async authenticateWithVkCallback(
    code: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    try {
      // Получаем данные пользователя из VK API
      const vkUserData = await this.vkService.authenticateWithCode(code);

      // Авторизуем через наш существующий метод
      return await this.authenticateWithVk(vkUserData, ipAddress);
    } catch (error) {
      console.error('Ошибка при авторизации через VK:', error);
      throw new UnauthorizedException('Не удалось авторизоваться через VK');
    }
  }

  async refreshTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    try {
      // Дополнительная валидация access token (опционально)
      try {
        await this.tokenService.verifyAccessToken(accessToken);
      } catch {
        // Access token может быть истекшим, это нормально для refresh
      }

      // Проверяем валидность refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.userService.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      // Проверяем, что refresh token совпадает с сохраненным в базе
      if (!user.refreshTokenHash) {
        throw new UnauthorizedException('Refresh token не найден в базе');
      }

      // Проверяем хеш refresh token
      const isTokenValid = await compare(refreshToken, user.refreshTokenHash);
      if (!isTokenValid) {
        throw new UnauthorizedException('Refresh token недействителен');
      }

      // Генерируем новые токены (ротация)
      return this.generateAuthTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userService.invalidateRefreshToken(userId);
  }

  // Принудительный отзыв всех токенов пользователя (для безопасности)
  async revokeAllTokens(userId: string): Promise<void> {
    await this.userService.invalidateRefreshToken(userId);
  }

  // Проверка валидности refresh token без обновления
  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.userService.findById(payload.userId);

      if (!user || !user.refreshTokenHash) {
        return false;
      }

      return await compare(refreshToken, user.refreshTokenHash);
    } catch {
      return false;
    }
  }

  async sendSms(phone: string): Promise<{ message: string }> {
    const result = await this.smsService.sendVerificationCode(phone);
    return { message: result.message };
  }

  async cleanupExpiredCodes(): Promise<void> {
    await this.smsService.cleanupExpiredCodes();
  }

  async getVerificationCode(phone: string): Promise<{ code: string } | null> {
    return await this.smsService.getVerificationCode(phone);
  }

  private async generateAuthTokens(user: User): Promise<AuthResponseDto> {
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.name,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      user.name,
    );

    const refreshTokenHash = await hash(refreshToken, 10);
    await this.userService.updateRefreshToken(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
    };
  }

  async validateUserPassword(hash_password: string, password: string) {
    return compare(password, hash_password);
  }
}
