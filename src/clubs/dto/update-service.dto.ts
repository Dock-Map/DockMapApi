import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Название сервиса' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Цена за единицу' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Единица измерения (например: час, день, штука)' })
  @IsOptional()
  @IsString()
  unit?: string;
}

