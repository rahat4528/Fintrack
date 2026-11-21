import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedStockUser } from '../../common/current-user.decorator';

@Controller('api/v1/portfolios')
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  listAccounts(@CurrentUser() user: AuthenticatedStockUser) {
    return this.portfoliosService.listUserAccounts(user.id);
  }

  @Get(':id')
  getAccount(
    @CurrentUser() user: AuthenticatedStockUser,
    @Param('id') id: string,
  ) {
    return this.portfoliosService.getAccountDetails(user.id, id);
  }
}
