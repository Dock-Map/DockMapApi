import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AuthProvider } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'Имя пользователя', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Номер телефона', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email пользователя', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Провайдер авторизации', enum: AuthProvider })
  @IsEnum(AuthProvider)
  authProvider: AuthProvider;

  @ApiProperty({ description: 'ID пользователя в провайдере', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: 'Telegram username', required: false })
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @ApiProperty({ description: 'VK ID', required: false })
  @IsOptional()
  @IsString()
  vkId?: string;

  @ApiProperty({ description: 'Верификация телефона', default: false })
  @IsOptional()
  isPhoneVerified?: boolean;
}
