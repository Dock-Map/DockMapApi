import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

class ClubDataDto {
  @ApiProperty({ description: 'Название клуба' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Адрес клуба' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Телефон клуба' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Email клуба', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Описание клуба', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL изображения марины', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Общее количество мест', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  totalSpots?: number;

  @ApiProperty({ description: 'Доступные места', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  availableSpots?: number;

  @ApiProperty({
    description: 'Особенности клуба',
    type: [String],
    required: false,
    example: ['Охрана', 'Видеонаблюдение', 'Гостевая швартовка'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ description: 'Широта для карты', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Долгота для карты', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateManyClubsDto {
  @ApiProperty({ description: 'ID пользователя-владельца клубов' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Массив данных клубов', type: [ClubDataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClubDataDto)
  clubs: ClubDataDto[];
}

