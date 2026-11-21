import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { RecurrenceFrequency, TransactionType } from '@prisma/client';

@Controller('api/v1/recurring')
@UseGuards(JwtAuthGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.recurringService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      accountId: string;
      categoryId?: string;
      type: TransactionType;
      amount: string;
      description: string;
      frequency: RecurrenceFrequency;
      startDate: string;
      autoPost?: boolean;
    },
  ) {
    return this.recurringService.create(user.id, body);
  }

  @Post('process')
  processDue(@CurrentUser() user: AuthenticatedUser) {
    return this.recurringService.processDueOccurrences(user.id);
  }
}
