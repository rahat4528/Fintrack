import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedBankingUser } from '../../common/current-user.decorator';

@Controller('api/v1/accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findMyAccounts(@CurrentUser() user: AuthenticatedBankingUser) {
    if (!user.customerProfileId) throw new ForbiddenException('Not registered as banking customer');
    return this.accountsService.findCustomerAccounts(user.customerProfileId);
  }

  @Get(':id')
  findById(@CurrentUser() user: AuthenticatedBankingUser, @Param('id') id: string) {
    if (!user.customerProfileId) throw new ForbiddenException('Not registered as banking customer');
    return this.accountsService.findById(user.customerProfileId, id);
  }

  @Get(':id/reconciliation')
  reconcile(@Param('id') id: string) {
    return this.accountsService.reconcileLedger(id);
  }
}
