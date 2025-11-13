import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ShipType } from 'src/shared/types/ship';
import { ClubParkingLocation } from 'src/shared/types/clubs';

export class FilterClubsDto {
  @ApiPropertyOptional({
    description: 'Поиск по имени и адресу клуба',
    example: 'Яхт-клуб',
  })
  @IsOptional()
  @IsString()
  searchString?: string;

  @ApiPropertyOptional({
    description: 'Минимальная цена за месяц',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerMonthMin?: number;

  @ApiPropertyOptional({
    description: 'Максимальная цена за месяц',
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerMonthMax?: number;

  @ApiPropertyOptional({
    description: 'Тип размещения (на воде/на суше)',
    enum: ClubParkingLocation,
    isArray: true,
    example: [ClubParkingLocation.WATER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ClubParkingLocation, { each: true })
  parkingLocations?: ClubParkingLocation[];

  @ApiPropertyOptional({
    description: 'Тип судна',
    enum: ShipType,
    isArray: true,
    example: [ShipType.YACHT, ShipType.CATER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ShipType, { each: true })
  shipTypes?: ShipType[];

  @ApiPropertyOptional({
    description: 'Удобства (features)',
    type: [String],
    example: ['Охрана территории', 'Электричество и вода'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Номер страницы',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Количество элементов на странице',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

