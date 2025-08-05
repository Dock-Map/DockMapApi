import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Query,
  UnauthorizedException,
  Param,
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
import { SmsService } from './services/sms.service';

interface AuthenticatedRequest extends Request {
  user: AuthResponseDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private smsService: SmsService,
  ) {}

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

  @Get('sms/verification-code/:phone')
  @ApiOperation({
    summary: 'Получить код верификации (только для тестирования)',
  })
  @ApiResponse({ status: 200, description: 'Код получен' })
  @ApiResponse({ status: 404, description: 'Код не найден' })
  async getVerificationCode(@Param('phone') phone: string) {
    const result = await this.authService.getVerificationCode(phone);
    if (!result) {
      throw new UnauthorizedException('Код верификации не найден или истек');
    }
    return result;
  }

  @Post('sms/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Очистить истекшие коды верификации' })
  @ApiResponse({ status: 200, description: 'Коды очищены' })
  async cleanupExpiredCodes() {
    await this.authService.cleanupExpiredCodes();
    return { message: 'Истекшие коды верификации очищены' };
  }

  @Get('sms/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Получить баланс SMS.RU' })
  @ApiResponse({ status: 200, description: 'Баланс получен' })
  async getBalance() {
    return await this.smsService.getBalance();
  }

  @Get('telegram/callback')
  @ApiOperation({ summary: 'Callback от Telegram Login Widget' })
  telegramCallback(@Query() query: { tgAuthResult: string }) {
    if (!query.tgAuthResult) {
      throw new Error('Missing tgAuthResult parameter');
    }

    const tgAuthResult = query.tgAuthResult;
    const base64Data = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');

    const userData = JSON.parse(jsonStr) as {
      id: string;
      first_name: string;
      last_name: string;
      username: string;
    };

    return userData;
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
  async telegramMockAuth(@Body() body: TelegramAuthDto, @Req() req: Request) {
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    // Преобразуем данные для соответствия интерфейсу AuthService
    const telegramData = {
      id: body.id,
      username: body.username || '',
      first_name: body.first_name,
      last_name: body.last_name || '',
      hash: body.hash,
    };
    return this.authService.authenticateWithTelegram(telegramData, ipAddress);
  }

  @Post('vk/mock')
  @ApiOperation({ summary: 'Моковая авторизация через VK' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async vkMockAuth(@Body() body: VkAuthDto, @Req() req: Request) {
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    // Преобразуем данные для соответствия интерфейсу AuthService
    const vkData = {
      id: body.id,
      first_name: body.first_name,
      last_name: body.last_name,
      screen_name: body.screen_name,
      email: body.email,
    };
    return this.authService.authenticateWithVk(vkData, ipAddress);
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

  @Post('revoke-all-tokens')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Отозвать все токены пользователя (для безопасности)',
  })
  @ApiResponse({ status: 200, description: 'Все токены отозваны' })
  async revokeAllTokens(@Req() req: AuthenticatedRequest) {
    await this.authService.revokeAllTokens(req.user.user.id);
    return { message: 'Все токены отозваны' };
  }

  @Post('validate-refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Проверить валидность refresh token' })
  @ApiResponse({ status: 200, description: 'Token валиден' })
  @ApiResponse({ status: 401, description: 'Token недействителен' })
  async validateRefreshToken(@Body() body: { refreshToken: string }) {
    const isValid = await this.authService.validateRefreshToken(
      body.refreshToken,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token недействителен');
    }
    return { valid: true };
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
