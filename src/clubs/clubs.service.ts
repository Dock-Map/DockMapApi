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

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    const club = this.clubRepository.create(createClubDto);
    await this.clubRepository.save(club);
    return await this.findOne(club.id);
  }

  async createMany(createManyClubsDto: CreateManyClubsDto): Promise<Club[]> {
    const { userId, clubs } = createManyClubsDto;
    
    const clubsToCreate = clubs.map((clubData) =>
      this.clubRepository.create({
        ...clubData,
        userId,
      }),
    );

    const savedClubs = await this.clubRepository.save(clubsToCreate);
    
    // Загружаем созданные клубы с безопасными данными владельца
    const clubIds = savedClubs.map((club) => club.id);
    return await this.clubRepository.find({
      where: { id: In(clubIds) },
      relations: ['owner'],
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
      relations: ['owner'],
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
      relations: ['owner'],
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
    await this.clubRepository.remove(club);
  }
}
