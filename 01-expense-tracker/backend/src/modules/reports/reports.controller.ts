import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getSummary(user.id);
  }

  @Get('category-breakdown')
  getCategoryBreakdown(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCategoryBreakdown(user.id, startDate, endDate);
  }

  @Get('monthly-trends')
  getMonthlyTrends(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getMonthlyTrends(user.id, year ? parseInt(year, 10) : undefined);
  }
}
