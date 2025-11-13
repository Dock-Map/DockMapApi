import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateManyClubsDto } from './dto/create-many-clubs.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { GetUserMetadata, UserMetadata } from 'src/shared/decorators/get-user.decorator';

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
  findAll() {
    return this.clubsService.findAll();
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
