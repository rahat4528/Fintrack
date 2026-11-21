import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CorporateActionsService, ApplySplitDto } from './corporate-actions.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Controller('api/v1/corporate-actions')
@UseGuards(JwtAuthGuard)
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

  @Post('split')
  applySplit(@Body() dto: ApplySplitDto) {
    return this.corporateActionsService.applyStockSplit(dto);
  }
}
