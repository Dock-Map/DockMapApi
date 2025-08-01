import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
