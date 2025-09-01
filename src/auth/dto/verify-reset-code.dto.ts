import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
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
}
