import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceDecimalUtil } from '../../common/decimal.util';
import { PaymentMethod, InvoiceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface RecordPaymentDto {
  amount: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paymentDate?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordPayment(organizationId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.organizationId !== organizationId) throw new ForbiddenException('Access denied');

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new BadRequestException('Cannot record payment on a DRAFT invoice. Please issue the invoice first.');
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already fully settled and paid.');
    }

    const paymentAmt = new Decimal(dto.amount);
    const currentBalanceDue = new Decimal(invoice.balanceDue.toString());
    const currentAmountPaid = new Decimal(invoice.amountPaid.toString());

    if (paymentAmt.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (paymentAmt.greaterThan(currentBalanceDue)) {
      throw new BadRequestException(
        `Payment amount ($${paymentAmt.toFixed(2)}) exceeds remaining balance due ($${currentBalanceDue.toFixed(2)})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          invoiceId,
          amount: paymentAmt,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        },
      });

      // 2. Compute updated balances
      const updatedAmountPaid = currentAmountPaid.plus(paymentAmt);
      const updatedBalanceDue = currentBalanceDue.minus(paymentAmt);
      const newStatus = updatedBalanceDue.isZero() ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      // 3. Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: updatedAmountPaid,
          balanceDue: updatedBalanceDue,
          status: newStatus,
        },
      });

      return {
        paymentRecord,
        invoice: {
          id: updatedInvoice.id,
          invoiceNumber: updatedInvoice.invoiceNumber,
          status: updatedInvoice.status,
          amountPaid: InvoiceDecimalUtil.format(updatedInvoice.amountPaid),
          balanceDue: InvoiceDecimalUtil.format(updatedInvoice.balanceDue),
        },
      };
    });
  }

  async listPaymentsForInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.organizationId !== organizationId) throw new NotFoundException('Invoice not found');

    return this.prisma.paymentRecord.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
