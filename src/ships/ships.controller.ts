import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipsService } from './ships.service';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { GetUserMetadata, UserMetadata } from 'src/shared/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('ships')
@Controller('ships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ShipsController {
  constructor(private readonly shipsService: ShipsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый корабль' })
  create(@Body() createShipDto: CreateShipDto, @GetUserMetadata() user: UserMetadata) {
    return this.shipsService.create(createShipDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех кораблей текущего пользователя' })
  findAll(@GetUserMetadata() user: UserMetadata) {
    return this.shipsService.findAll(user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить список кораблей по userId' })
  findByUserId(@Param('userId') userId: string) {
    return this.shipsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить корабль по ID' })
  findOne(@Param('id') id: string) {
    return this.shipsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить корабль' })
  update(@Param('id') id: string, @Body() updateShipDto: UpdateShipDto, @GetUserMetadata() user: UserMetadata) {
    return this.shipsService.update(id, updateShipDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить корабль' })
  remove(@Param('id') id: string, @GetUserMetadata() user: UserMetadata) {
    return this.shipsService.remove(id, user);
  }
}
