import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService, RecordPaymentDto } from './payments.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedInvoiceUser } from '../../common/current-user.decorator';

@Controller('api/v1/invoices/:invoiceId/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  recordPayment(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.paymentsService.recordPayment(user.organizationId, invoiceId, dto);
  }

  @Get()
  listPayments(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.paymentsService.listPaymentsForInvoice(user.organizationId, invoiceId);
  }
}
