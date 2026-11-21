import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SyncService, SyncEventPayload } from './sync.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get(':budgetId/events')
  getEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('budgetId') budgetId: string,
    @Query('since') since?: string,
  ) {
    return this.syncService.getEventsSince(user.id, budgetId, since ? parseInt(since, 10) : 0);
  }

  @Post(':budgetId/events')
  ingest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('budgetId') budgetId: string,
    @Body() body: { events: SyncEventPayload[] },
  ) {
    return this.syncService.ingestClientEvents(user.id, budgetId, body.events);
  }

  @Get(':budgetId/replay')
  replay(@CurrentUser() user: AuthenticatedUser, @Param('budgetId') budgetId: string) {
    return this.syncService.replayEventStream(user.id, budgetId);
  }
}
