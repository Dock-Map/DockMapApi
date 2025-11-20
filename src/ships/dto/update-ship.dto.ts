import { PartialType } from '@nestjs/swagger';
import { CreateShipDto } from './create-ship.dto';

export class UpdateShipDto extends PartialType(CreateShipDto) {}
