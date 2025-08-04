import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class VkAuthDto {
  @ApiProperty({ description: 'VK ID пользователя' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Фамилия пользователя' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Screen name в VK', required: false })
  @IsOptional()
  @IsString()
  screen_name?: string;

  @ApiProperty({ description: 'Email пользователя', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
