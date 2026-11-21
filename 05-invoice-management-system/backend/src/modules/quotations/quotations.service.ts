import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceDecimalUtil } from '../../common/decimal.util';
import { QuotationStatus, InvoiceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface CreateQuotationDto {
  clientId: string;
  expiryDate: string;
  items: Array<{ description: string; qty: number; unitPrice: number; lineTotal: number }>;
  notes?: string;
}

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listQuotations(organizationId: string) {
    const quotes = await this.prisma.quotation.findMany({
      where: { organizationId },
      include: { client: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map((q) => ({
      ...q,
      totalAmount: InvoiceDecimalUtil.format(q.totalAmount),
    }));
  }

  async createQuotation(organizationId: string, dto: CreateQuotationDto) {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const quoteNumber = `${org.quotePrefix}-${org.nextQuoteNum}`;
      await tx.organization.update({
        where: { id: organizationId },
        data: { nextQuoteNum: org.nextQuoteNum + 1 },
      });

      let total = new Decimal(0);
      for (const item of dto.items) {
        total = total.plus(new Decimal(item.lineTotal));
      }

      return tx.quotation.create({
        data: {
          organizationId,
          clientId: dto.clientId,
          quoteNumber,
          status: QuotationStatus.SENT,
          expiryDate: new Date(dto.expiryDate),
          totalAmount: total,
          items: dto.items,
          notes: dto.notes,
        },
        include: { client: true },
      });
    });
  }

  async convertToInvoice(organizationId: string, quotationId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quote) throw new NotFoundException('Quotation not found');
    if (quote.organizationId !== organizationId) throw new ForbiddenException('Access denied');

    if (quote.status === QuotationStatus.CONVERTED) {
      throw new BadRequestException('Quotation has already been converted to an invoice');
    }

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const invoiceNumber = `${org.invoicePrefix}-${org.nextInvoiceNum}`;
      await tx.organization.update({
        where: { id: organizationId },
        data: { nextInvoiceNum: org.nextInvoiceNum + 1 },
      });

      const quoteItems = quote.items as Array<{ description: string; qty: number; unitPrice: number; lineTotal: number }>;
      const invoiceItems = quoteItems.map((qi) => ({
        description: qi.description,
        quantity: new Decimal(qi.qty),
        unitPrice: new Decimal(qi.unitPrice),
        taxPercent: new Decimal(0),
        taxAmount: new Decimal(0),
        lineTotal: new Decimal(qi.lineTotal),
      }));

      const newInvoice = await tx.invoice.create({
        data: {
          organizationId,
          clientId: quote.clientId,
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotalAmount: quote.totalAmount,
          taxAmount: new Decimal(0),
          discountAmount: new Decimal(0),
          totalAmount: quote.totalAmount,
          balanceDue: quote.totalAmount,
          notes: `Converted from quotation ${quote.quoteNumber}. ${quote.notes || ''}`,
          items: {
            create: invoiceItems,
          },
        },
      });

      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.CONVERTED,
          convertedInvoiceId: newInvoice.id,
        },
      });

      return newInvoice;
    });
  }
}
