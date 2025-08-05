import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { GetUser } from '../shared/decorators/get-user.decorator';

interface AuthenticatedRequest extends Request {
  user: AuthResponseDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sms/send')
  @ApiOperation({ summary: 'Отправить SMS с кодом верификации' })
  @ApiResponse({ status: 200, description: 'SMS отправлен' })
  @ApiResponse({ status: 400, description: 'Неверный номер телефона' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.authService.sendSms(sendSmsDto.phoneNumber);
  }

  @Post('sms/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Проверить SMS код и авторизоваться' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Неверный код' })
  async verifySms(@Body() verifySmsDto: VerifySmsDto, @Req() req: Request) {
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return this.authService.authenticateWithSms(
      verifySmsDto.phoneNumber,
      verifySmsDto.code,
      ipAddress,
    );
  }

  @Get('telegram/oauth-link')
  @ApiOperation({ summary: 'Получить ссылку для авторизации через Telegram' })
  getTelegramOauthLink() {
    return this.authService.getTelegramOauthLink();
  }

  @UseGuards(TelegramAuthGuard)
  @Get('telegram/callback')
  @ApiOperation({ summary: 'Callback от Telegram Login Widget' })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Неверная подпись Telegram' })
  telegramCallback(@GetUser() user: AuthResponseDto) {
    console.log(user, 'USER');

    return user;
  }

  // VK OAuth
  @Get('vk')
  @ApiOperation({ summary: 'Авторизация через VKontakte' })
  vkAuth() {
    // VK OAuth flow - автоматическое перенаправление
  }

  @Get('vk/callback')
  @ApiOperation({ summary: 'Callback от VKontakte OAuth' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  vkCallback(@Req() req: AuthenticatedRequest): AuthResponseDto {
    return req.user; // Возвращает результат от VkStrategy
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Недействительный refresh token' })
  async refreshTokens(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  async logout(@Req() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.user.id);
    return { message: 'Успешный выход' };
  }

  @ApiBearerAuth('JWT')
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя' })
  getProfile(@Req() req: AuthenticatedRequest): AuthResponseDto {
    return req.user;
  }
}
