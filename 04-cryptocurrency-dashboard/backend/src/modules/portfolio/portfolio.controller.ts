import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PortfolioService, CreatePortfolioDto, AddTransactionDto } from './portfolio.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedCryptoUser } from '../../common/current-user.decorator';

@Controller('api/v1/portfolios')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  listPortfolios(@CurrentUser() user: AuthenticatedCryptoUser) {
    return this.portfolioService.listUserPortfolios(user.id);
  }

  @Post()
  createPortfolio(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Body() dto: CreatePortfolioDto,
  ) {
    return this.portfolioService.createPortfolio(user.id, dto);
  }

  @Get(':id')
  getPortfolio(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Param('id') id: string,
  ) {
    return this.portfolioService.getPortfolioDetails(user.id, id);
  }

  @Post(':id/transactions')
  addTransaction(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Param('id') id: string,
    @Body() dto: AddTransactionDto,
  ) {
    return this.portfolioService.addTransaction(user.id, id, dto);
  }
}
