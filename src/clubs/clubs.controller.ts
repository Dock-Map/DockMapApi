import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Создать яхт-клуб с опциональной загрузкой фото' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Опциональное изображение клуба',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'ID пользователя-владельца клуба',
        },
        name: {
          type: 'string',
          description: 'Название клуба',
        },
        address: {
          type: 'string',
          description: 'Адрес клуба',
        },
        phone: {
          type: 'string',
          description: 'Телефон клуба',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email клуба (опционально)',
        },
        description: {
          type: 'string',
          description: 'Описание клуба (опционально)',
        },
        imageUrl: {
          type: 'string',
          description: 'URL изображения (опционально, если не загружается файл)',
        },
        totalSpots: {
          type: 'number',
          description: 'Общее количество мест (опционально)',
        },
        availableSpots: {
          type: 'number',
          description: 'Доступные места (опционально)',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Особенности клуба (опционально)',
        },
        latitude: {
          type: 'number',
          description: 'Широта для карты (опционально)',
        },
        longitude: {
          type: 'number',
          description: 'Долгота для карты (опционально)',
        },
        tariffs: {
          type: 'array',
          description: 'Тарифы клуба (опционально)',
        },
        services: {
          type: 'array',
          description: 'Сервисы клуба (опционально)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Парсим JSON строки для массивов и объектов, если они пришли как строки
    try {
      const createClubDto: CreateClubDto = {
        ...body,
        features: typeof body.features === 'string' 
          ? (body.features ? JSON.parse(body.features) : undefined)
          : body.features,
        tariffs: typeof body.tariffs === 'string'
          ? (body.tariffs ? JSON.parse(body.tariffs) : undefined)
          : body.tariffs,
        services: typeof body.services === 'string'
          ? (body.services ? JSON.parse(body.services) : undefined)
          : body.services,
        totalSpots: body.totalSpots ? Number(body.totalSpots) : body.totalSpots,
        availableSpots: body.availableSpots ? Number(body.availableSpots) : body.availableSpots,
        latitude: body.latitude ? Number(body.latitude) : body.latitude,
        longitude: body.longitude ? Number(body.longitude) : body.longitude,
      };

      return this.clubsService.create(createClubDto, file);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Неверный формат JSON для массивов или объектов');
      }
      throw error;
    }
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
