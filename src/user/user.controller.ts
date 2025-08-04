import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findMe() {
    return 'me';
  }

  @Post('send-sms')
  @ApiOperation({ summary: 'Отправить SMS с кодом верификации' })
  @ApiResponse({ status: 200, description: 'SMS отправлено' })
  @ApiResponse({ status: 400, description: 'Неверный номер телефона' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.userService.sendVerificationCode(sendSmsDto.phoneNumber);
  }

  @Post('verify-sms')
  @ApiOperation({ summary: 'Проверить SMS код' })
  @ApiResponse({ status: 200, description: 'Код проверен' })
  @ApiResponse({ status: 400, description: 'Неверный код' })
  verifySms(@Body() verifySmsDto: VerifySmsDto) {
    return this.userService.verifyCode(
      verifySmsDto.phoneNumber,
      verifySmsDto.code,
    );
  }

  @Delete('cleanup-expired-codes')
  @ApiOperation({ summary: 'Очистить истекшие коды верификации' })
  @ApiResponse({ status: 200, description: 'Истекшие коды удалены' })
  async cleanupExpiredCodes() {
    await this.userService.cleanupExpiredCodes();
    return { message: 'Истекшие коды удалены' };
  }

  // Только для тестирования - получение кода из базы данных
  @Get('verification-codes/:phoneNumber')
  @ApiOperation({
    summary: 'Получить код верификации (только для тестирования)',
  })
  @ApiResponse({ status: 200, description: 'Код получен' })
  @ApiResponse({ status: 404, description: 'Код не найден' })
  async getVerificationCode(@Param('phoneNumber') phoneNumber: string) {
    return this.userService.getVerificationCode(phoneNumber);
  }
}
