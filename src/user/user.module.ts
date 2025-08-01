import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SmsService } from '../shared/services/sms.service';

@Module({
  controllers: [UserController],
  providers: [UserService, SmsService],
})
export class UserModule {}
