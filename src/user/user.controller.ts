import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    cityId: number;
  };
}

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('complete-registration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Завершить регистрацию - выбрать город и роль' })
  @ApiResponse({ status: 200, description: 'Регистрация завершена' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async completeRegistration(
    @Body() completeRegistrationDto: CompleteRegistrationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userData = req.user;
    if (!userData?.userId) {
      throw new Error('Пользователь не найден');
    }

    const updatedUser = await this.userService.completeRegistration(
      userData.userId,
      completeRegistrationDto.cityId,
      completeRegistrationDto.role,
    );

    return {
      message: 'Регистрация завершена',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        cityId: updatedUser.cityId,
      },
    };
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
