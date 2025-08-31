import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthCheckModule } from 'src/healthCheck/healthCheck.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    HealthCheckModule,
    // Временно отключено для тестирования деплоя:
    // TypeOrmModule, UserModule, AuthModule, SharedModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
