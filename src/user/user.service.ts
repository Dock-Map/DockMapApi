import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { SmsService } from '../shared/services/sms.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        providerId: telegramId,
        authProvider: AuthProvider.TELEGRAM,
      },
    });
  }

  async findByVkId(vkId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        vkId: vkId,
        authProvider: AuthProvider.VK,
      },
    });
  }

  async updatePhoneVerification(
    userId: string,
    isVerified: boolean,
  ): Promise<void> {
    await this.userRepository.update(userId, { isPhoneVerified: isVerified });
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash });
  }

  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: undefined });
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.save({ ...user, ...updateUserDto });
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    const code = this.smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    // Удаляем старые коды для этого номера
    await this.verificationCodeRepository.delete({ phoneNumber });

    // Создаем новый код
    const verificationCode = this.verificationCodeRepository.create({
      phoneNumber,
      code,
      expiresAt,
    });
    await this.verificationCodeRepository.save(verificationCode);

    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    if (isDev) {
      return {
        success: true,
        message: 'Код отправлен ' + code,
      };
    }
    const success = await this.smsService.sendVerificationCode(
      phoneNumber,
      code,
    );

    return {
      success,
      message: success ? 'Код отправлен' : 'Ошибка отправки кода',
    };
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: { phoneNumber, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!verificationCode) {
      return { success: false, message: 'Код не найден' };
    }

    if (new Date() > verificationCode.expiresAt) {
      await this.verificationCodeRepository.delete({ id: verificationCode.id });
      return { success: false, message: 'Код истек' };
    }

    if (verificationCode.code !== code) {
      return { success: false, message: 'Неверный код' };
    }

    // Помечаем код как использованный
    await this.verificationCodeRepository.update(
      { id: verificationCode.id },
      { isUsed: true },
    );

    return { success: true, message: 'Код подтвержден' };
  }

  // Метод для очистки истекших кодов (можно запускать по расписанию)
  async cleanupExpiredCodes(): Promise<void> {
    await this.verificationCodeRepository.delete({
      expiresAt: new Date(),
    });
  }

  // Только для тестирования - получение кода верификации
  async getVerificationCode(
    phoneNumber: string,
  ): Promise<{ code: string } | null> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: { phoneNumber, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!verificationCode) {
      return null;
    }

    return { code: verificationCode.code };
  }
}
