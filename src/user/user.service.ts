import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

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
}
