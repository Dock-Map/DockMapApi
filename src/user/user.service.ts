import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  create() {
    return 'This action adds a new user';
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
