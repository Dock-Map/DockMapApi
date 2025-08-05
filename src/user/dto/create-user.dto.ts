import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AuthProvider } from '../entities/user.entity';
import { UserRole } from 'src/shared/types/user.role';

export class CreateUserDto {
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    default: UserRole.OWNER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Номер телефона' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Email пользователя', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Telegram Chat ID', required: false })
  @IsOptional()
  @IsString()
  telegramChatId?: string;

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
