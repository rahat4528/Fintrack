import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TaxLotsService, ExecuteTradeDto } from './tax-lots.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedStockUser } from '../../common/current-user.decorator';

@Controller('api/v1/portfolios/:accountId')
@UseGuards(JwtAuthGuard)
export class TaxLotsController {
  constructor(private readonly taxLotsService: TaxLotsService) {}

  @Post('trades')
  executeTrade(
    @CurrentUser() user: AuthenticatedStockUser,
    @Param('accountId') accountId: string,
    @Body() dto: ExecuteTradeDto,
  ) {
    return this.taxLotsService.executeTrade(user.id, accountId, dto);
  }

  @Get('tax-lots')
  listTaxLots(
    @CurrentUser() user: AuthenticatedStockUser,
    @Param('accountId') accountId: string,
  ) {
    return this.taxLotsService.listTaxLots(user.id, accountId);
  }

  @Get('realized-gains')
  listRealizedGains(
    @CurrentUser() user: AuthenticatedStockUser,
    @Param('accountId') accountId: string,
  ) {
    return this.taxLotsService.listRealizedGains(user.id, accountId);
  }
}
