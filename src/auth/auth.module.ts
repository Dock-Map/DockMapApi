import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SmsService } from './services/sms.service';
import { expiresAccessIn } from 'src/shared/constants';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { UserModule } from '../user/user.module';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { VkStrategy } from './strategies/vk.strategy';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: expiresAccessIn },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SmsService,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    TelegramStrategy,
    VkStrategy,
    TelegramAuthGuard,
  ],
  exports: [AuthService, TokenService, SmsService],
})
export class AuthModule {}
