import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class VkCallbackDto {
  @ApiProperty({ description: 'Код авторизации от VK', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'ID устройства', required: false })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiProperty({
    description: 'Время жизни токена в секундах',
    required: false,
  })
  @IsOptional()
  @IsString()
  expires_in?: string;

  @ApiProperty({ description: 'Состояние для безопасности', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Внешний ID', required: false })
  @IsOptional()
  @IsString()
  ext_id?: string;

  @ApiProperty({ description: 'Тип авторизации', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
