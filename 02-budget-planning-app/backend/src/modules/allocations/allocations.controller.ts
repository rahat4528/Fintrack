import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1/allocations')
@UseGuards(JwtAuthGuard)
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Post()
  setAllocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { periodId: string; categoryId: string; assignedAmount: string },
  ) {
    return this.allocationsService.setAllocation(
      user.id,
      body.periodId,
      body.categoryId,
      body.assignedAmount,
    );
  }

  @Post('transfer')
  transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      periodId: string;
      sourceCategoryId: string;
      destinationCategoryId: string;
      amount: string;
    },
  ) {
    return this.allocationsService.transferBetweenEnvelopes(
      user.id,
      body.periodId,
      body.sourceCategoryId,
      body.destinationCategoryId,
      body.amount,
    );
  }
}
