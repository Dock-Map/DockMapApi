import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club } from './entities/club.entity';
import { Tariff } from './entities/tariff.entity';
import { Service } from './entities/service.entity';
import { User } from 'src/user/entities/user.entity';
import { Image } from 'src/image/entities/image.entity';
import { TariffsService } from './services/tariffs.service';
import { ServicesService } from './services/services.service';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Club, Tariff, Service, User, Image]),
    ImageModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService, TariffsService, ServicesService],
  exports: [ClubsService, TariffsService, ServicesService],
})
export class ClubsModule {}
