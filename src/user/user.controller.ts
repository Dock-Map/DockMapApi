import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Получить информацию о пользователе' })
  findMe() {
    return 'me';
  }

  @Get('cities')
  @ApiOperation({ summary: 'Получить список доступных городов' })
  @ApiResponse({
    status: 200,
    description: 'Список городов получен',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          region: { type: 'string' },
        },
      },
    },
  })
  getCities(): Array<{ id: number; name: string; region?: string }> {
    return this.userService.getCities();
  }
}
