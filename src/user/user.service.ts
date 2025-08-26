import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from 'src/shared/types/user.role';

interface City {
  id: number;
  name: string;
  region?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
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

  async updateEmailVerification(
    userId: string,
    isVerified: boolean,
  ): Promise<void> {
    await this.userRepository.update(userId, { isEmailVerified: isVerified });
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

  async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginIp: ipAddress,
      lastLoginAt: new Date(),
    });
  }

  async completeRegistration(
    userId: string,
    cityId: number,
    role: UserRole.OWNER | UserRole.CLUB_ADMIN,
  ): Promise<User> {
    const city = this.getCityById(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Обновляем пользователя с выбранным городом и ролью
    user.role = role;
    // Здесь можно добавить поле для города пользователя, если нужно
    // user.cityId = cityId;

    return this.userRepository.save(user);
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

  getCities(): City[] {
    return [
      { id: 1, name: 'Санкт-Петербург', region: 'Ленинградская область' },
      { id: 2, name: 'Москва', region: 'Московская область' },
      { id: 3, name: 'Пермь', region: 'Пермский край' },
      { id: 4, name: 'Сочи', region: 'Краснодарский край' },
      { id: 5, name: 'Крым', region: 'Республика Крым' },
      { id: 6, name: 'Самара', region: 'Самарская область' },
    ];
  }

  getCityById(cityId: number): City | null {
    const cities = this.getCities();
    return cities.find((city) => city.id === cityId) || null;
  }
}
