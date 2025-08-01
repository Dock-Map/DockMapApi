import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FierbaseService {
  constructor(@Inject('FIREBASE_APP') private readonly app: admin.app.App) {}

  checkWork() {
    return this.app.name;
  }
}
