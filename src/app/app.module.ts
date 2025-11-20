import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthCheckModule } from 'src/healthCheck/healthCheck.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { ClubsModule } from 'src/clubs/clubs.module';
import { ShipsModule } from 'src/ships/ships.module';
// import { SharedModule } from 'src/shared/shared.module';
import { User } from 'src/user/entities/user.entity';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';
import { Club } from 'src/clubs/entities/club.entity';
import { Ship } from 'src/ships/entities/ship.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          synchronize: true,
          timezone: 'UTC',
          dateStrings: true,
          extra: {
            options: '-c timezone=UTC',
          },
          entities: [
            User,
            VerificationCode,
            Club,
            Ship,
          ],
        };
      },
    }),
    HealthCheckModule,
    UserModule,
    AuthModule,
    ClubsModule,
    ShipsModule,
    // SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
