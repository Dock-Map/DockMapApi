import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateManyClubsDto } from './dto/create-many-clubs.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubsDto } from './dto/filter-clubs.dto';
import { Club } from './entities/club.entity';
import { UserMetadata } from 'src/shared/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from 'src/shared/constants';
import { TariffsService } from './services/tariffs.service';
import { ServicesService } from './services/services.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { ImageService } from 'src/image/image.service';
import { Image } from 'src/image/entities/image.entity';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tariffsService: TariffsService,
    private readonly servicesService: ServicesService,
    private readonly imageService: ImageService,
  ) {}

  async create(createClubDto: CreateClubDto, imageFile?: Express.Multer.File): Promise<Club> {
    const { tariffs, services, ...clubData } = createClubDto;
    
    let image: Image | null = null;
    if (imageFile) {
      image = await this.imageService.create(imageFile, 'clubs');
    }

    const club = this.clubRepository.create({
      ...clubData,
      image: image || undefined, // Устанавливаем связь напрямую через объект
      imageId: image?.id,
      imageUrl: image?.url,
    });
    const savedClub = await this.clubRepository.save(club);

    // Создаем тарифы, если они указаны
    if (tariffs && tariffs.length > 0) {
      const tariffsToCreate: CreateTariffDto[] = tariffs.map((tariff) => ({
        ...tariff,
        clubId: savedClub.id,
      }));
      await this.tariffsService.createMany(tariffsToCreate);
    }

    // Создаем сервисы, если они указаны
    if (services && services.length > 0) {
      const servicesToCreate: CreateServiceDto[] = services.map((service) => ({
        ...service,
        clubId: savedClub.id,
      }));
      await this.servicesService.createMany(servicesToCreate);
    }

    return await this.findOne(savedClub.id);
  }

  async createMany(createManyClubsDto: CreateManyClubsDto): Promise<Club[]> {
    const { userId, clubs } = createManyClubsDto;
    
    const clubsToCreate = clubs.map((clubData) => {
      const { tariffs, services, ...clubFields } = clubData;
      return this.clubRepository.create({
        ...clubFields,
        userId,
      });
    });

    const savedClubs = await this.clubRepository.save(clubsToCreate);

    // Создаем тарифы и сервисы для каждого клуба
    for (let i = 0; i < savedClubs.length; i++) {
      const clubData = clubs[i];
      const savedClub = savedClubs[i];

      if (clubData.tariffs && clubData.tariffs.length > 0) {
        const tariffsToCreate: CreateTariffDto[] = clubData.tariffs.map((tariff) => ({
          ...tariff,
          clubId: savedClub.id,
        }));
        await this.tariffsService.createMany(tariffsToCreate);
      }

      if (clubData.services && clubData.services.length > 0) {
        const servicesToCreate: CreateServiceDto[] = clubData.services.map((service) => ({
          ...service,
          clubId: savedClub.id,
        }));
        await this.servicesService.createMany(servicesToCreate);
      }
    }
    
    // Загружаем созданные клубы с безопасными данными владельца
    const clubIds = savedClubs.map((club) => club.id);
    return await this.clubRepository.find({
      where: { id: In(clubIds) },
      relations: ['owner', 'tariffs', 'services', 'image'],
      select: {
        owner: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          telegramUsername: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        image: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          key: true,
          url: true,
          bucket: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });
  }

  async findAll(filterDto?: FilterClubsDto): Promise<{
    data: Club[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filterDto?.page || DEFAULT_PAGE;
    const limit = filterDto?.limit || DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clubRepository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.owner', 'owner')
      .leftJoinAndSelect('club.image', 'image')
      .select([
        'club.id',
        'club.name',
        'club.address',
        'club.phone',
        'club.email',
        'club.pricePerMonth',
        'club.pricePerYear',
        'club.pricePerDay',
        'club.shipType',
        'club.parkingLocations',
        'club.description',
        'club.imageId',
        'club.imageUrl',
        'club.totalSpots',
        'club.availableSpots',
        'club.features',
        'club.latitude',
        'club.longitude',
        'club.userId',
        'club.createdAt',
        'club.updatedAt',
      ])
      .addSelect([
        'image.id',
        'image.filename',
        'image.originalName',
        'image.mimeType',
        'image.size',
        'image.key',
        'image.url',
        'image.bucket',
        'image.createdAt',
        'image.updatedAt',
      ])
      .addSelect([
        'owner.id',
        'owner.name',
        'owner.phone',
        'owner.email',
        'owner.role',
        'owner.telegramUsername',
        'owner.isPhoneVerified',
        'owner.isEmailVerified',
        'owner.createdAt',
        'owner.updatedAt',
      ]);

    // Поиск по имени и адресу
    if (filterDto?.searchString) {
      queryBuilder.andWhere(
        '(club.name ILIKE :searchString OR club.address ILIKE :searchString)',
        { searchString: `%${filterDto.searchString}%` },
      );
    }

    // Фильтр по цене за месяц
    if (filterDto?.pricePerMonthMin !== undefined) {
      queryBuilder.andWhere('club.pricePerMonth >= :pricePerMonthMin', {
        pricePerMonthMin: filterDto.pricePerMonthMin,
      });
    }

    if (filterDto?.pricePerMonthMax !== undefined) {
      queryBuilder.andWhere('club.pricePerMonth <= :pricePerMonthMax', {
        pricePerMonthMax: filterDto.pricePerMonthMax,
      });
    }

    // Фильтр по типу размещения
    if (filterDto?.parkingLocations && filterDto.parkingLocations.length > 0) {
      // Используем условие, что хотя бы один из указанных типов размещения должен присутствовать
      const parkingConditions = filterDto.parkingLocations
        .map((_, index) => `:parkingLocation${index} = ANY(club.parkingLocations)`)
        .join(' OR ');
      queryBuilder.andWhere(`(${parkingConditions})`, 
        filterDto.parkingLocations.reduce((acc, location, index) => {
          acc[`parkingLocation${index}`] = location;
          return acc;
        }, {} as Record<string, string>),
      );
    }

    // Фильтр по типу судна
    if (filterDto?.shipTypes && filterDto.shipTypes.length > 0) {
      // Используем условие, что хотя бы один из указанных типов судна должен присутствовать
      const shipConditions = filterDto.shipTypes
        .map((_, index) => `:shipType${index} = ANY(club.shipType)`)
        .join(' OR ');
      queryBuilder.andWhere(`(${shipConditions})`,
        filterDto.shipTypes.reduce((acc, shipType, index) => {
          acc[`shipType${index}`] = shipType;
          return acc;
        }, {} as Record<string, string>),
      );
    }

    // Фильтр по удобствам
    if (filterDto?.features && filterDto.features.length > 0) {
      // Используем условие, что все указанные удобства должны присутствовать
      filterDto.features.forEach((feature, index) => {
        queryBuilder.andWhere(`:feature${index} = ANY(club.features)`, {
          [`feature${index}`]: feature,
        });
      });
    }

    // Получаем общее количество записей
    const total = await queryBuilder.getCount();

    // Применяем пагинацию
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: { id },
      relations: ['owner', 'tariffs', 'services', 'image'],
      select: {
        owner: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          telegramUsername: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        image: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          key: true,
          url: true,
          bucket: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });
    if (!club) {
      throw new NotFoundException(`Клуб с ID ${id} не найден`);
    }
    return club;
  }

  async findByUserId(userId: string): Promise<Club[]> {
    return await this.clubRepository.find({
      where: { userId },
      relations: ['owner', 'image'],
      select: {
        owner: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          telegramUsername: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        image: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          key: true,
          url: true,
          bucket: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });
  }

  async update(id: string, updateClubDto: UpdateClubDto, user: UserMetadata): Promise<Club> {
    const club = await this.findOne(id);
    if (club.userId !== user.userId) {
      throw new ForbiddenException('You are not allowed to update this club');
    }
    Object.assign(club, updateClubDto);
    await this.clubRepository.save(club);
    return await this.findOne(id);
  }

  async remove(id: string, user: UserMetadata): Promise<void> {
    const club = await this.findOne(id);
    if (club.userId !== user.userId) {
      throw new ForbiddenException('You are not allowed to delete this club');
    }
    
    // Удаляем связанные тарифы и сервисы (cascade должно сработать, но на всякий случай)
    await this.tariffsService.removeByClubId(id);
    await this.servicesService.removeByClubId(id);
    
    await this.clubRepository.remove(club);
  }
}
