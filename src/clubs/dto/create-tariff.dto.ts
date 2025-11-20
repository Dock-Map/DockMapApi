import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ description: 'Единица измерения (например: метр, день, месяц)' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Цена за единицу' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ description: 'ID клуба' })
  @IsUUID()
  clubId: string;
}

