import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedStockUser } from '../../common/current-user.decorator';

@Controller('api/v1/portfolios/:accountId/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('rebalance')
  getRebalancing(
    @CurrentUser() user: AuthenticatedStockUser,
    @Param('accountId') accountId: string,
  ) {
    return this.analyticsService.calculateRebalancing(user.id, accountId);
  }
}
