import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { SmsService } from '../shared/services/sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, VerificationCode])],
  controllers: [UserController],
  providers: [UserService, SmsService],
  exports: [UserService],
})
export class UserModule {}
