import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.budgetsService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; currency?: string; startingBalance?: string },
  ) {
    return this.budgetsService.create(user.id, body);
  }

  @Get(':id')
  findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.budgetsService.findById(user.id, id);
  }

  @Get(':id/periods/:year/:month')
  getPeriodWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.budgetsService.getPeriodWorkspace(
      user.id,
      id,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }
}
