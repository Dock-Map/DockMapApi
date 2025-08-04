import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { TokenService } from './token.service';
import { UserService } from '../../user/user.service';
import { AuthProvider, User } from '../../user/entities/user.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';

// Интерфейс для данных Telegram (соответствует TelegramAuthDto)
interface TelegramAuthData {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: string;
  hash?: string;
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
  ) {}

  // Универсальная авторизация через SMS
  async authenticateWithSms(
    phone: string,
    code: string,
  ): Promise<AuthResponseDto> {
    // Проверка SMS кода
    const verificationResult = await this.userService.verifyCode(phone, code);
    if (!verificationResult.success) {
      throw new UnauthorizedException(verificationResult.message);
    }

    let user = await this.userService.findByPhone(phone);

    if (!user) {
      // Создаем нового пользователя
      user = await this.userService.create({
        phone,
        name: `User_${phone.slice(-4)}`,
        authProvider: AuthProvider.SMS,
        isPhoneVerified: true,
      });
    } else {
      // Обновляем статус верификации
      await this.userService.updatePhoneVerification(user.id, true);
    }

    return this.generateAuthTokens(user);
  }

  async authenticateWithTelegram(
    telegramData: TelegramAuthData,
  ): Promise<AuthResponseDto> {
    const { id, username, first_name, last_name } = telegramData;

    let user = await this.userService.findByTelegramId(id.toString());

    if (!user) {
      user = await this.userService.create({
        name: `${first_name} ${last_name || ''}`.trim(),
        authProvider: AuthProvider.TELEGRAM,
        providerId: id.toString(),
        telegramUsername: username,
      });
    }

    return this.generateAuthTokens(user);
  }

  // Авторизация через VK
  async authenticateWithVk(vkData: VkAuthData): Promise<AuthResponseDto> {
    const { id, first_name, last_name, email } = vkData;

    let user = await this.userService.findByVkId(id);

    if (!user) {
      user = await this.userService.create({
        name: `${first_name} ${last_name}`.trim(),
        email,
        authProvider: AuthProvider.VK,
        providerId: id,
        vkId: id,
      });
    }

    return this.generateAuthTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.userService.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      return this.generateAuthTokens(user);
    } catch {
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userService.invalidateRefreshToken(userId);
  }

  async sendSms(phone: string): Promise<{ message: string }> {
    const result = await this.userService.sendVerificationCode(phone);
    return { message: result.message };
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
