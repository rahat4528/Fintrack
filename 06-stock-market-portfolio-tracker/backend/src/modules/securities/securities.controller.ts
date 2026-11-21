import { Controller, Get, UseGuards } from '@nestjs/common';
import { SecuritiesService } from './securities.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Controller('api/v1/securities')
export class SecuritiesController {
  constructor(private readonly securitiesService: SecuritiesService) {}

  @Get()
  listSecurities() {
    return this.securitiesService.listSecurities();
  }
}
