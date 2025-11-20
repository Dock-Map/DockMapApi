import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateTariffDto {
  @ApiPropertyOptional({ description: 'Единица измерения (например: метр, день, месяц)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Цена за единицу' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;
}

