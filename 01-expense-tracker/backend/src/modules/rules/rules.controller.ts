import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { RuleOperator, RuleActionType } from '@prisma/client';

@Controller('api/v1/rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.rulesService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      name: string;
      priority?: number;
      field: string;
      operator: RuleOperator;
      matchValue: string;
      actionType: RuleActionType;
      actionValue: string;
    },
  ) {
    return this.rulesService.create(user.id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rulesService.delete(user.id, id);
  }

  @Post('evaluate')
  evaluate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { description: string; amount?: string; categoryId?: string; tagIds?: string[] },
  ) {
    return this.rulesService.applyRules(user.id, body);
  }
}
