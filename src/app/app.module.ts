import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthCheckModule } from 'src/healthCheck/healthCheck.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
// import { SharedModule } from 'src/shared/shared.module';
import { User } from 'src/user/entities/user.entity';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';

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
        const isProduction = process.env.NODE_ENV === 'production';

        const dbConfig = {
          type: 'postgres' as const,
          host:
            configService.get<string>('DATABASE_HOST') ||
            (isProduction ? '192.168.0.5' : 'localhost'),
          port: configService.get<number>('DATABASE_PORT') || 5432,
          username:
            configService.get<string>('DATABASE_USER') ||
            (isProduction ? 'gen_user' : 'dock'),
          password:
            configService.get<string>('DATABASE_PASSWORD') ||
            (isProduction ? 'pY:Gi#x6iQ0g-(' : 'dock'),
          database:
            configService.get<string>('DATABASE_NAME') ||
            (isProduction ? 'default_db' : 'dock'),
          synchronize: true,
          entities: [User, VerificationCode],
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };

        console.log(
          `🔧 Database config: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
        );
        console.log(
          `🔧 Environment: ${isProduction ? 'production' : 'development'}`,
        );

        return dbConfig;
      },
    }),
    HealthCheckModule,
    UserModule,
    AuthModule,
    // SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
