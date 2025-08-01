import { Controller, Get } from '@nestjs/common';
import { FierbaseService } from './fierbase.service';

@Controller('fierbase')
export class FierbaseController {
  constructor(private readonly fierbaseService: FierbaseService) {}

  @Get('check')
  check() {
    return this.fierbaseService.checkWork();
  }
}
