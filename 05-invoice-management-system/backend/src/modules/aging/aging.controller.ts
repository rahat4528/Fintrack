import { Controller, Get, UseGuards } from '@nestjs/common';
import { AgingService } from './aging.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedInvoiceUser } from '../../common/current-user.decorator';

@Controller('api/v1/aging')
@UseGuards(JwtAuthGuard)
export class AgingController {
  constructor(private readonly agingService: AgingService) {}

  @Get('summary')
  getAgingSummary(@CurrentUser() user: AuthenticatedInvoiceUser) {
    return this.agingService.calculateAgingReport(user.organizationId);
  }
}
