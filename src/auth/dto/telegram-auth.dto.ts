import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({ description: 'Telegram ID пользователя' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Username в Telegram', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Фамилия пользователя', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ description: 'URL фотографии пользователя', required: false })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ description: 'Дата авторизации' })
  @IsDateString()
  auth_date: string;

  @ApiProperty({ description: 'Хеш для проверки подписи' })
  @IsString()
  hash: string;
}
