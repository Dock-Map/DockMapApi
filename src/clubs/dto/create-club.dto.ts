import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTariffNestedDto } from './create-tariff-nested.dto';
import { CreateServiceNestedDto } from './create-service-nested.dto';

export class CreateClubDto {
  @ApiProperty({ description: 'ID пользователя-владельца клуба' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Название клуба' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Адрес клуба' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Телефон клуба' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email клуба' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Описание клуба' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'URL изображения марины' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Общее количество мест', default: 0 })
  @IsOptional()
  @IsNumber()
  totalSpots?: number;

  @ApiPropertyOptional({ description: 'Доступные места', default: 0 })
  @IsOptional()
  @IsNumber()
  availableSpots?: number;

  @ApiPropertyOptional({
    description: 'Особенности клуба',
    type: [String],
    example: ['Охрана', 'Видеонаблюдение', 'Гостевая швартовка'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Широта для карты' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Долгота для карты' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Тарифы клуба',
    type: [CreateTariffNestedDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTariffNestedDto)
  tariffs?: CreateTariffNestedDto[];

  @ApiPropertyOptional({
    description: 'Сервисы клуба',
    type: [CreateServiceNestedDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceNestedDto)
  services?: CreateServiceNestedDto[];
}
