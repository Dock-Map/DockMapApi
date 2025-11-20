import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateTariffNestedDto {
  @ApiProperty({ description: 'Единица измерения (например: метр, день, месяц)' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Цена за единицу' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}

