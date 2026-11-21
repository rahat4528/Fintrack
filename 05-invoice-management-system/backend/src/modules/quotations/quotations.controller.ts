import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QuotationsService, CreateQuotationDto } from './quotations.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedInvoiceUser } from '../../common/current-user.decorator';

@Controller('api/v1/quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  listQuotations(@CurrentUser() user: AuthenticatedInvoiceUser) {
    return this.quotationsService.listQuotations(user.organizationId);
  }

  @Post()
  createQuotation(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.createQuotation(user.organizationId, dto);
  }

  @Post(':id/convert')
  convertToInvoice(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('id') id: string,
  ) {
    return this.quotationsService.convertToInvoice(user.organizationId, id);
  }
}
