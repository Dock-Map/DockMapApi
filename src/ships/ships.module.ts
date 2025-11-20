import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipsService } from './ships.service';
import { ShipsController } from './ships.controller';
import { Ship } from './entities/ship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ship])],
  controllers: [ShipsController],
  providers: [ShipsService],
  exports: [ShipsService],
})
export class ShipsModule {}
