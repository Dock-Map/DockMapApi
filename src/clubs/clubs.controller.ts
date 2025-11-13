import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateManyClubsDto } from './dto/create-many-clubs.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubsDto } from './dto/filter-clubs.dto';
import { GetUserMetadata, UserMetadata } from 'src/shared/decorators/get-user.decorator';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  @Post('bulk')
  createMany(@Body() createManyClubsDto: CreateManyClubsDto) {
    return this.clubsService.createMany(createManyClubsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список клубов с фильтрацией и пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Список клубов получен',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Club' },
        },
        total: { type: 'number', description: 'Общее количество клубов' },
        page: { type: 'number', description: 'Текущая страница' },
        limit: { type: 'number', description: 'Количество элементов на странице' },
        totalPages: { type: 'number', description: 'Общее количество страниц' },
      },
    },
  })
  findAll(@Query() filterDto: FilterClubsDto) {
    return this.clubsService.findAll(filterDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.clubsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto, @GetUserMetadata() user: UserMetadata) {
    return this.clubsService.update(id, updateClubDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUserMetadata() user: UserMetadata) {
    return this.clubsService.remove(id, user);
  }
}
