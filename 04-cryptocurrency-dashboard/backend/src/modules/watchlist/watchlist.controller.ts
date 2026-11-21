import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedCryptoUser } from '../../common/current-user.decorator';

@Controller('api/v1/watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  getWatchlist(@CurrentUser() user: AuthenticatedCryptoUser) {
    return this.watchlistService.getUserWatchlist(user.id);
  }

  @Post(':symbol')
  addToWatchlist(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Param('symbol') symbol: string,
  ) {
    return this.watchlistService.addToWatchlist(user.id, symbol);
  }

  @Delete(':symbol')
  removeFromWatchlist(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Param('symbol') symbol: string,
  ) {
    return this.watchlistService.removeFromWatchlist(user.id, symbol);
  }
}
