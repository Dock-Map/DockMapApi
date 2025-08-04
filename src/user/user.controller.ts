import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Получить информацию о пользователе' })
  findMe() {
    return 'me';
  }
}
