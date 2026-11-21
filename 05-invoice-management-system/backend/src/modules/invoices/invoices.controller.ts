import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvoicesService, CreateInvoiceDto } from './invoices.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedInvoiceUser } from '../../common/current-user.decorator';
import { InvoiceStatus } from '@prisma/client';

@Controller('api/v1/invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  listInvoices(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.listInvoices(user.organizationId, status);
  }

  @Get(':id')
  getInvoice(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('id') id: string,
  ) {
    return this.invoicesService.getInvoice(user.organizationId, id);
  }

  @Post()
  createInvoice(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createInvoice(user.organizationId, dto);
  }

  @Put(':id')
  updateDraft(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('id') id: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.updateDraftInvoice(user.organizationId, id, dto);
  }

  @Post(':id/issue')
  issueInvoice(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('id') id: string,
  ) {
    return this.invoicesService.issueInvoice(user.organizationId, id);
  }
}
