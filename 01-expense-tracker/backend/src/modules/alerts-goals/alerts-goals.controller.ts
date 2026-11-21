import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AlertsGoalsService } from './alerts-goals.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class AlertsGoalsController {
  constructor(private readonly alertsGoalsService: AlertsGoalsService) {}

  @Get('goals')
  findAllGoals(@CurrentUser() user: AuthenticatedUser) {
    return this.alertsGoalsService.findAllGoals(user.id);
  }

  @Post('goals')
  createGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; targetAmount: string; targetDate?: string },
  ) {
    return this.alertsGoalsService.createGoal(user.id, body);
  }

  @Patch('goals/:id/contribute')
  contributeGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { amount: string },
  ) {
    return this.alertsGoalsService.updateGoalContribution(user.id, id, body.amount);
  }

  @Get('alerts')
  findAllAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.alertsGoalsService.findAllAlerts(user.id);
  }

  @Post('alerts')
  createAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      categoryId: string;
      thresholdValue: string;
      periodMonth: number;
      periodYear: number;
    },
  ) {
    return this.alertsGoalsService.createAlert(user.id, body);
  }

  @Post('alerts/check')
  checkAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.alertsGoalsService.checkAlerts(user.id);
  }
}
