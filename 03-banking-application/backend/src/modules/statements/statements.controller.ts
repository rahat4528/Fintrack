import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedBankingUser } from '../../common/current-user.decorator';

@Controller('api/v1/statements')
@UseGuards(JwtAuthGuard)
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get(':accountNumber')
  getStatement(
    @Param('accountNumber') accountNumber: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: AuthenticatedBankingUser,
  ) {
    return this.statementsService.generateStatement(accountNumber, startDate, endDate, user);
  }
}
