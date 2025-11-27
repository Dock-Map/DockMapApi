import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { expiresAccessIn, expiresRefreshIn } from 'src/shared/constants';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        id:userId,
        email,
      },
      {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'dockServerKeyProd',
        expiresIn: expiresAccessIn,
      },
    );
  }

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        id: userId,
        email,
      },
      {
        secret:
          this.configService.get<string>('JWT_SECRET_REFRESH') ||
          'dockServerKeyRefreshProd',
        expiresIn: expiresRefreshIn,
      },
    );
  }

  async verifyRefreshToken(refreshToken: string): Promise<{ id: string }> {
    return this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_SECRET_REFRESH'),
    });
  }

  async verifyAccessToken(
    accessToken: string,
  ): Promise<{ id: string; email: string }> {
    return this.jwtService.verifyAsync(accessToken, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
