import { Global, Module } from '@nestjs/common';
import { FierbaseService } from './fierbase.service';
import { FierbaseController } from './fierbase.controller';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: configService.get<string>('TYPE'),
      project_id: configService.get<string>('PROJECT_ID'),
      private_key_id: configService.get<string>('PRIVATE_KEY_ID'),
      private_key: configService
        .get<string>('PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'),
      client_email: configService.get<string>('CLIENT_EMAIL'),
      client_id: configService.get<string>('CLIENT_ID'),
      auth_uri: configService.get<string>('AUTH_URI'),
      token_uri: configService.get<string>('TOKEN_URI'),
      auth_provider_x509_cert_url: configService.get<string>('AUTH_CERT_URL'),
      client_x509_cert_url: configService.get<string>('CLIENT_CERT_URL'),
      universe_domain: configService.get<string>('UNIVERSAL_DOMAIN'),
    } as admin.ServiceAccount;
    return admin.initializeApp({
      credential: admin.credential?.cert(firebaseConfig),
    });
  },
};

@Global()
@Module({
  controllers: [FierbaseController],
  providers: [FierbaseService, firebaseProvider],
  exports: [firebaseProvider],
})
export class FierbaseModule {}
