import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { Club } from '../entities/club.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const club = await this.clubRepository.findOne({
      where: { id: createServiceDto.clubId },
    });

    if (!club) {
      throw new NotFoundException(`Клуб с ID ${createServiceDto.clubId} не найден`);
    }

    const service = this.serviceRepository.create(createServiceDto);
    return await this.serviceRepository.save(service);
  }

  async createMany(services: CreateServiceDto[]): Promise<Service[]> {
    if (!services || services.length === 0) {
      return [];
    }

    const clubIds = [...new Set(services.map((s) => s.clubId))];
    const clubs = await this.clubRepository.find({
      where: { id: In(clubIds) },
    });

    if (clubs.length !== clubIds.length) {
      throw new NotFoundException('Один или несколько клубов не найдены');
    }

    const servicesToCreate = this.serviceRepository.create(services);
    return await this.serviceRepository.save(servicesToCreate);
  }

  async findAllByClubId(clubId: string): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: { clubId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['club'],
    });

    if (!service) {
      throw new NotFoundException(`Сервис с ID ${id} не найден`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, updateServiceDto);
    return await this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
  }

  async removeByClubId(clubId: string): Promise<void> {
    await this.serviceRepository.delete({ clubId });
  }
}

