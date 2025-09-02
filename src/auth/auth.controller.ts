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
  Redirect,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { VkCallbackDto, VkCallbackPostDto } from './dto/vk-callback.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
// import { TestEmailDto } from './dto/test-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { SmsService } from './services/sms.service';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

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

  // EMAIL/PASSWORD РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ
  @ApiTags('Email Authentication')
  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  async registerWithEmail(
    @Body() registerDto: EmailRegisterDto,
    @Req() req: Request,
  ) {
    const ipAddress = '127.0.0.1';
    //req.ip || req.connection.remoteAddress || req?.socket?.remoteAddress;
    return this.authService.registerWithEmail(registerDto, ipAddress);
  }

  @ApiTags('Email Authentication')
  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Авторизация через email/password',
    description:
      'Вход в систему с использованием email и пароля. Возвращает JWT токены для дальнейшей авторизации.',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-string',
          name: 'Иван Иванов',
          email: 'user@example.com',
          phone: 'email_user@example.com',
          role: 'OWNER',
          authProvider: 'EMAIL',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные запроса',
    schema: {
      example: {
        statusCode: 400,
        message: ['Email обязателен', 'Пароль обязателен'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Неверные учетные данные или email зарегистрирован через другой способ',
    schema: {
      example: {
        statusCode: 401,
        message: 'Неверные учетные данные',
        error: 'Unauthorized',
      },
    },
  })
  async loginWithEmail(@Body() loginDto: EmailLoginDto, @Req() req: Request) {
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return this.authService.authenticateWithEmail(loginDto, ipAddress);
  }

  // SMS АВТОРИЗАЦИЯ
  @ApiTags('SMS Authentication')
  @Post('sms/send')
  @ApiOperation({ summary: 'Отправить SMS с кодом верификации' })
  @ApiResponse({ status: 200, description: 'SMS отправлен' })
  @ApiResponse({ status: 400, description: 'Неверный номер телефона' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.authService.sendSms(sendSmsDto.phoneNumber);
  }

  @ApiTags('SMS Authentication')
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

  @ApiTags('SMS Authentication')
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

  @ApiTags('SMS Authentication')
  @Post('sms/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Очистить истекшие коды верификации' })
  @ApiResponse({ status: 200, description: 'Коды очищены' })
  async cleanupExpiredCodes() {
    await this.authService.cleanupExpiredCodes();
    return { message: 'Истекшие коды верификации очищены' };
  }

  @ApiTags('SMS Authentication')
  @Get('sms/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Получить баланс SMS.RU' })
  @ApiResponse({ status: 200, description: 'Баланс получен' })
  async getBalance() {
    return await this.smsService.getBalance();
  }

  @Get('telegram/oauth-link')
  @ApiOperation({ summary: 'Получить ссылку для авторизации через Telegram' })
  getTelegramOauthLink() {
    return this.authService.getTelegramOauthLink();
  }

  @ApiTags('Social Authentication')
  @Get('telegram/callback')
  @UseGuards(TelegramAuthGuard)
  @ApiOperation({ summary: 'Callback от Telegram Login Widget' })
  telegramCallback(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('vk/callback')
  @ApiOperation({ summary: 'Callback от VK Login Widget' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Ошибка авторизации через VK' })
  @Redirect()
  vkCallback(@Query() query: VkCallbackDto) {
    const clientUrl = new URL('dockmap://auth/vk-callback');
    clientUrl.searchParams.set('code', query.code || '');
    clientUrl.searchParams.set('state', query.state || '');
    clientUrl.searchParams.set('device_id', query.device_id || '');
    clientUrl.searchParams.set('type', query.type || '');
    clientUrl.searchParams.set('expires_in', query.expires_in || '');
    clientUrl.searchParams.set('ext_id', query.ext_id || '');

    return {
      url: clientUrl.toString(),
      statusCode: 302,
    };
  }

  @Post('vk/callback')
  @ApiOperation({ summary: 'Callback от VK Login Widget' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Ошибка авторизации через VK' })
  async vkCallbackPost(
    @Body() body: VkCallbackPostDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return await this.authService.handleVkCallback(body, ipAddress);
  }

  // Обновление токенов
  @ApiTags('Token Management')
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Недействительный refresh token' })
  async refreshTokens(@Body() refreshTokensDto: RefreshTokensDto) {
    return this.authService.refreshTokens(
      refreshTokensDto.accessToken,
      refreshTokensDto.refreshToken,
    );
  }

  @ApiTags('Token Management')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  async logout(@Req() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.user.id);
    return { message: 'Успешный выход' };
  }

  @ApiTags('Token Management')
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

  @ApiTags('Token Management')
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

  @ApiTags('User Profile')
  @ApiBearerAuth('JWT')
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя' })
  getProfile(@Req() req: AuthenticatedRequest): AuthResponseDto {
    return req.user;
  }

  // СБРОС ПАРОЛЯ ЧЕРЕЗ EMAIL
  @ApiTags('Password Reset')
  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Запросить сброс пароля через email',
    description:
      'Отправляет 6-значный код подтверждения на указанный email для сброса пароля. Код действителен 10 минут.',
  })
  @ApiResponse({
    status: 200,
    description: 'Код отправлен на email',
    schema: {
      example: {
        success: true,
        message: 'Код для сброса пароля отправлен на email',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные запроса',
    schema: {
      example: {
        statusCode: 400,
        message: ['Некорректный формат email'],
        error: 'Bad Request',
      },
    },
  })
  async requestPasswordReset(@Body() resetRequestDto: ResetPasswordRequestDto) {
    return this.authService.sendPasswordResetCode(resetRequestDto?.email);
  }

  @ApiTags('Password Reset')
  @Post('password/verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Проверить код сброса пароля',
    description: 'Проверяет правильность 6-значного кода для сброса пароля',
  })
  @ApiResponse({
    status: 200,
    description: 'Код подтвержден',
    schema: {
      example: {
        success: true,
        message: 'Код подтвержден. Можете установить новый пароль',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный или истекший код',
    schema: {
      example: {
        success: false,
        message: 'Неверный код или код не найден',
      },
    },
  })
  async verifyResetCode(@Body() verifyCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyPasswordResetCode(
      verifyCodeDto.email,
      verifyCodeDto.code,
    );
  }

  @ApiTags('Password Reset')
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Установить новый пароль',
    description:
      'Устанавливает новый пароль после подтверждения кода. Отзывает все существующие токены для безопасности.',
  })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменен',
    schema: {
      example: {
        success: true,
        message: 'Пароль успешно изменен',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный код или ошибка валидации',
    schema: {
      example: {
        success: false,
        message: 'Неверный код или код не найден',
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
  }

  @ApiTags('Password Reset')
  @Post('password/cleanup-expired')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Очистить истекшие коды сброса пароля (только для администраторов)',
  })
  @ApiResponse({ status: 200, description: 'Истекшие коды очищены' })
  async cleanupExpiredPasswordResetCodes() {
    await this.authService.cleanupExpiredPasswordResetCodes();
    return { message: 'Истекшие коды сброса пароля очищены' };
  }

  @ApiTags('Password Reset')
  @Get('password/verification-code/:email')
  @ApiOperation({
    summary: 'Получить код верификации для email (только для тестирования)',
  })
  @ApiResponse({ status: 200, description: 'Код получен' })
  @ApiResponse({ status: 404, description: 'Код не найден' })
  async getPasswordResetCode(@Param('email') email: string) {
    const result = await this.authService.getPasswordResetCode(email);
    if (!result) {
      throw new UnauthorizedException('Код верификации не найден или истек');
    }
    return result;
  }

  @ApiTags('Password Reset')
  @Post('email/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Тестовая отправка email (для отладки)',
    description:
      'Проверяет подключение к email серверу и отправляет тестовое сообщение с кодом 123456',
  })
  @ApiBody({
    description: 'Email адрес для тестовой отправки',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'test@example.com',
          description: 'Email адрес для тестовой отправки',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email отправлен или ошибка подключения',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Тестовый email отправлен' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные',
  })
  async testEmail(@Body() body: { email: string }) {
    try {
      console.log(`[TEST EMAIL] Testing email send to: ${body.email}`);

      // Используем emailService из authService напрямую
      const emailSent = await this.authService[
        'emailService'
      ].sendResetPasswordCode(body.email, '123456');

      return {
        success: emailSent,
        message: emailSent
          ? 'Тестовый email отправлен успешно'
          : 'Ошибка отправки email',
      };
    } catch (error) {
      console.error('[TEST EMAIL] Error:', error.message);
      return {
        success: false,
        message: `Ошибка тестирования email: ${error.message}`,
      };
    }
  }
}
