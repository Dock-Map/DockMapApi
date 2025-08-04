import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VkAuthDto } from './dto/vk-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

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
  async verifySms(@Body() verifySmsDto: VerifySmsDto) {
    return this.authService.authenticateWithSms(
      verifySmsDto.phoneNumber,
      verifySmsDto.code,
    );
  }

  @Get('telegram/callback')
  @UseGuards(AuthGuard('telegram'))
  @ApiOperation({ summary: 'Callback от Telegram Login Widget' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  telegramCallback(@Req() req: AuthenticatedRequest): AuthResponseDto {
    return req.user; // Возвращает результат от TelegramStrategy
  }

  // VK OAuth
  @Get('vk')
  @UseGuards(AuthGuard('vkontakte'))
  @ApiOperation({ summary: 'Авторизация через VKontakte' })
  vkAuth() {
    // VK OAuth flow - автоматическое перенаправление
  }

  @Get('vk/callback')
  @UseGuards(AuthGuard('vkontakte'))
  @ApiOperation({ summary: 'Callback от VKontakte OAuth' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  vkCallback(@Req() req: AuthenticatedRequest): AuthResponseDto {
    return req.user; // Возвращает результат от VkStrategy
  }

  // Моковые эндпоинты для тестирования
  @Post('telegram/mock')
  @ApiOperation({ summary: 'Моковая авторизация через Telegram' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async telegramMockAuth(@Body() body: TelegramAuthDto) {
    // Преобразуем данные для соответствия интерфейсу AuthService
    const telegramData = {
      id: body.id,
      username: body.username || '',
      first_name: body.first_name,
      last_name: body.last_name || '',
    };
    return this.authService.authenticateWithTelegram(telegramData);
  }

  @Post('vk/mock')
  @ApiOperation({ summary: 'Моковая авторизация через VK' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async vkMockAuth(@Body() body: VkAuthDto) {
    // Преобразуем данные для соответствия интерфейсу AuthService
    const vkData = {
      id: body.id,
      first_name: body.first_name,
      last_name: body.last_name,
      screen_name: body.screen_name,
      email: body.email,
    };
    return this.authService.authenticateWithVk(vkData);
  }

  // Обновление токенов
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

  @Delete('cleanup-expired-codes')
  @ApiOperation({ summary: 'Очистить истекшие коды верификации' })
  @ApiResponse({ status: 200, description: 'Истекшие коды удалены' })
  cleanupExpiredCodes() {
    this.authService.cleanupExpiredCodes();
    return { message: 'Истекшие коды удалены' };
  }

  // Только для тестирования - получение кода из базы данных
  @Get('verification-codes/:phoneNumber')
  @ApiOperation({
    summary: 'Получить код верификации (только для тестирования)',
  })
  @ApiResponse({ status: 200, description: 'Код получен' })
  @ApiResponse({ status: 404, description: 'Код не найден' })
  getVerificationCode() {
    return this.authService.getVerificationCode();
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
