import { Controller, Post, Body, Headers, UseGuards, ForbiddenException } from '@nestjs/common';
import { TransfersService, ExecuteTransferDto } from './transfers.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedBankingUser } from '../../common/current-user.decorator';

@Controller('api/v1/transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('execute')
  execute(
    @CurrentUser() user: AuthenticatedBankingUser,
    @Body() dto: ExecuteTransferDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!user.customerProfileId) throw new ForbiddenException('Not registered as banking customer');
    return this.transfersService.executeTransfer(user.customerProfileId, dto, idempotencyKey);
  }
}
