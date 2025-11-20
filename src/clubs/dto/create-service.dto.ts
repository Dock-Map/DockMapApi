import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Название сервиса' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Цена за единицу' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ description: 'Единица измерения (например: час, день, штука)' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'ID клуба' })
  @IsUUID()
  clubId: string;
}

