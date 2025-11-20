import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { Ship } from './entities/ship.entity';
import { UserMetadata } from 'src/shared/decorators/get-user.decorator';

@Injectable()
export class ShipsService {
  constructor(
    @InjectRepository(Ship)
    private readonly shipRepository: Repository<Ship>,
  ) {}

  async create(createShipDto: CreateShipDto, userId: string): Promise<Ship> {
    const ship = this.shipRepository.create({
      ...createShipDto,
      userId,
    });
    await this.shipRepository.save(ship);
    return await this.findOne(ship.id);
  }

  async findAll(userId?: string): Promise<Ship[]> {
    const where = userId ? { userId } : {};
    return await this.shipRepository.find({
      where,
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<Ship> {
    const ship = await this.shipRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    });
    if (!ship) {
      throw new NotFoundException(`Корабль с ID ${id} не найден`);
    }
    return ship;
  }

  async findByUserId(userId: string): Promise<Ship[]> {
    return await this.shipRepository.find({
      where: { userId },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    });
  }

  async update(id: string, updateShipDto: UpdateShipDto, user: UserMetadata): Promise<Ship> {
    const ship = await this.findOne(id);
    if (ship.userId !== user.userId) {
      throw new ForbiddenException('Вы не можете обновить этот корабль');
    }
    Object.assign(ship, updateShipDto);
    await this.shipRepository.save(ship);
    return await this.findOne(id);
  }

  async remove(id: string, user: UserMetadata): Promise<void> {
    const ship = await this.findOne(id);
    if (ship.userId !== user.userId) {
      throw new ForbiddenException('Вы не можете удалить этот корабль');
    }
    await this.shipRepository.remove(ship);
  }
}
