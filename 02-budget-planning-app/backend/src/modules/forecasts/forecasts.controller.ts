import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ForecastsService } from './forecasts.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/forecasts')
@UseGuards(JwtAuthGuard)
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Get(':budgetId/bills')
  getBills(@CurrentUser() user: AuthenticatedUser, @Param('budgetId') budgetId: string) {
    return this.forecastsService.getBillCalendar(user.id, budgetId);
  }
}
