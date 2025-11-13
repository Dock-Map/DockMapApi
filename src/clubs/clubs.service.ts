import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateManyClubsDto } from './dto/create-many-clubs.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Club } from './entities/club.entity';
import { UserMetadata } from 'src/shared/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';

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

  async findAll(): Promise<Club[]> {
    return await this.clubRepository.find({
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
