import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';
import { ShipType } from 'src/shared/types/ship';

export class CreateShipDto {
  @ApiProperty({ description: 'Название корабля' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Тип корабля',
    enum: ShipType,
    example: ShipType.YACHT,
  })
  @IsEnum(ShipType)
  type: ShipType;
}
