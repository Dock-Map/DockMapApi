import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tariff } from '../entities/tariff.entity';
import { CreateTariffDto } from '../dto/create-tariff.dto';
import { UpdateTariffDto } from '../dto/update-tariff.dto';
import { Club } from '../entities/club.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  async create(createTariffDto: CreateTariffDto): Promise<Tariff> {
    const club = await this.clubRepository.findOne({
      where: { id: createTariffDto.clubId },
    });

    if (!club) {
      throw new NotFoundException(`Клуб с ID ${createTariffDto.clubId} не найден`);
    }

    const tariff = this.tariffRepository.create(createTariffDto);
    return await this.tariffRepository.save(tariff);
  }

  async createMany(tariffs: CreateTariffDto[]): Promise<Tariff[]> {
    if (!tariffs || tariffs.length === 0) {
      return [];
    }

    const clubIds = [...new Set(tariffs.map((t) => t.clubId))];
    const clubs = await this.clubRepository.find({
      where: { id: In(clubIds) },
    });

    if (clubs.length !== clubIds.length) {
      throw new NotFoundException('Один или несколько клубов не найдены');
    }

    const tariffsToCreate = this.tariffRepository.create(tariffs);
    return await this.tariffRepository.save(tariffsToCreate);
  }

  async findAllByClubId(clubId: string): Promise<Tariff[]> {
    return await this.tariffRepository.find({
      where: { clubId },
      order: { unit: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tariff> {
    const tariff = await this.tariffRepository.findOne({
      where: { id },
      relations: ['club'],
    });

    if (!tariff) {
      throw new NotFoundException(`Тариф с ID ${id} не найден`);
    }

    return tariff;
  }

  async update(id: string, updateTariffDto: UpdateTariffDto): Promise<Tariff> {
    const tariff = await this.findOne(id);
    Object.assign(tariff, updateTariffDto);
    return await this.tariffRepository.save(tariff);
  }

  async remove(id: string): Promise<void> {
    const tariff = await this.findOne(id);
    await this.tariffRepository.remove(tariff);
  }

  async removeByClubId(clubId: string): Promise<void> {
    await this.tariffRepository.delete({ clubId });
  }
}

