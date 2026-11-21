import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DebtPlanningService, DebtItem } from './debt-planning.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/debt-planning')
@UseGuards(JwtAuthGuard)
export class DebtPlanningController {
  constructor(private readonly debtService: DebtPlanningService) {}

  @Get(':budgetId')
  getDebts(@CurrentUser() user: AuthenticatedUser, @Param('budgetId') budgetId: string) {
    return this.debtService.getDebtsForBudget(user.id, budgetId);
  }

  @Post('compare')
  compareStrategies(
    @Body() body: { debts: DebtItem[]; extraMonthlyPayment: string },
  ) {
    return this.debtService.compareStrategies(body.debts, body.extraMonthlyPayment);
  }
}
