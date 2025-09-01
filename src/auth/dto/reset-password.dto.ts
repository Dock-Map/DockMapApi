import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @ApiProperty({
    description: '6-значный код подтверждения',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Код должен быть строкой' })
  @Length(6, 6, { message: 'Код должен содержать 6 цифр' })
  @IsNotEmpty({ message: 'Код обязателен' })
  code: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'NewSecurePassword123!',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  newPassword: string;
}
