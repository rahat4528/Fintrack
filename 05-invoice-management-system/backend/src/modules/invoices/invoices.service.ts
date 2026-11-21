import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceDecimalUtil } from '../../common/decimal.util';
import { InvoiceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface InvoiceItemDto {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRateId?: string;
  productId?: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  dueDate: string;
  items: InvoiceItemDto[];
  discountAmount?: string;
  notes?: string;
  terms?: string;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listInvoices(organizationId: string, status?: InvoiceStatus) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: status ? status : undefined,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      ...inv,
      subtotalAmount: InvoiceDecimalUtil.format(inv.subtotalAmount),
      taxAmount: InvoiceDecimalUtil.format(inv.taxAmount),
      discountAmount: InvoiceDecimalUtil.format(inv.discountAmount),
      totalAmount: InvoiceDecimalUtil.format(inv.totalAmount),
      amountPaid: InvoiceDecimalUtil.format(inv.amountPaid),
      balanceDue: InvoiceDecimalUtil.format(inv.balanceDue),
    }));
  }

  async getInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { taxRate: true, product: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.organizationId !== organizationId) throw new ForbiddenException('Access denied');

    return {
      ...invoice,
      subtotalAmount: InvoiceDecimalUtil.format(invoice.subtotalAmount),
      taxAmount: InvoiceDecimalUtil.format(invoice.taxAmount),
      discountAmount: InvoiceDecimalUtil.format(invoice.discountAmount),
      totalAmount: InvoiceDecimalUtil.format(invoice.totalAmount),
      amountPaid: InvoiceDecimalUtil.format(invoice.amountPaid),
      balanceDue: InvoiceDecimalUtil.format(invoice.balanceDue),
    };
  }

  async createInvoice(organizationId: string, dto: CreateInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('An invoice must have at least one line item');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Concurrency-safe sequential numbering
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
      });

      const invoiceNumber = `${org.invoicePrefix}-${org.nextInvoiceNum}`;
      await tx.organization.update({
        where: { id: organizationId },
        data: { nextInvoiceNum: org.nextInvoiceNum + 1 },
      });

      // 2. Compute line items and totals with Decimal precision
      let subtotal = new Decimal(0);
      let totalTax = new Decimal(0);

      const itemsToCreate = [];
      for (const item of dto.items) {
        const qty = new Decimal(item.quantity);
        const unitPrice = new Decimal(item.unitPrice);
        const lineNet = qty.times(unitPrice);

        let taxPercent = new Decimal(0);
        let taxAmount = new Decimal(0);

        if (item.taxRateId) {
          const taxRate = await tx.taxRate.findUnique({ where: { id: item.taxRateId } });
          if (taxRate) {
            taxPercent = new Decimal(taxRate.ratePercent.toString());
            taxAmount = lineNet.times(taxPercent.dividedBy(100));
          }
        }

        subtotal = subtotal.plus(lineNet);
        totalTax = totalTax.plus(taxAmount);

        itemsToCreate.push({
          productId: item.productId || null,
          taxRateId: item.taxRateId || null,
          description: item.description,
          quantity: qty,
          unitPrice,
          taxPercent,
          taxAmount,
          lineTotal: lineNet,
        });
      }

      const discount = dto.discountAmount ? new Decimal(dto.discountAmount) : new Decimal(0);
      const totalAmount = subtotal.plus(totalTax).minus(discount);
      const balanceDue = totalAmount;

      return tx.invoice.create({
        data: {
          organizationId,
          clientId: dto.clientId,
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          dueDate: new Date(dto.dueDate),
          subtotalAmount: subtotal,
          taxAmount: totalTax,
          discountAmount: discount,
          totalAmount,
          amountPaid: new Decimal(0),
          balanceDue,
          notes: dto.notes,
          terms: dto.terms,
          items: {
            create: itemsToCreate,
          },
        },
        include: { items: true, client: true },
      });
    });
  }

  async updateDraftInvoice(organizationId: string, id: string, dto: CreateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');
    if (existing.organizationId !== organizationId) throw new ForbiddenException('Access denied');

    // Immutability invariant: Cannot edit an issued invoice
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot edit invoice ${existing.invoiceNumber}: Status is ${existing.status}. Issued invoices are strictly immutable. Create a credit note instead.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      let subtotal = new Decimal(0);
      let totalTax = new Decimal(0);

      const itemsToCreate = [];
      for (const item of dto.items) {
        const qty = new Decimal(item.quantity);
        const unitPrice = new Decimal(item.unitPrice);
        const lineNet = qty.times(unitPrice);

        let taxPercent = new Decimal(0);
        let taxAmount = new Decimal(0);

        if (item.taxRateId) {
          const taxRate = await tx.taxRate.findUnique({ where: { id: item.taxRateId } });
          if (taxRate) {
            taxPercent = new Decimal(taxRate.ratePercent.toString());
            taxAmount = lineNet.times(taxPercent.dividedBy(100));
          }
        }

        subtotal = subtotal.plus(lineNet);
        totalTax = totalTax.plus(taxAmount);

        itemsToCreate.push({
          productId: item.productId || null,
          taxRateId: item.taxRateId || null,
          description: item.description,
          quantity: qty,
          unitPrice,
          taxPercent,
          taxAmount,
          lineTotal: lineNet,
        });
      }

      const discount = dto.discountAmount ? new Decimal(dto.discountAmount) : new Decimal(0);
      const totalAmount = subtotal.plus(totalTax).minus(discount);

      return tx.invoice.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          dueDate: new Date(dto.dueDate),
          subtotalAmount: subtotal,
          taxAmount: totalTax,
          discountAmount: discount,
          totalAmount,
          balanceDue: totalAmount,
          notes: dto.notes,
          terms: dto.terms,
          items: {
            create: itemsToCreate,
          },
        },
        include: { items: true },
      });
    });
  }

  async issueInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.organizationId !== organizationId) throw new ForbiddenException('Access denied');

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Invoice has already been issued');
    }

    // Freeze snapshot
    const frozenSnapshot = {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: new Date().toISOString(),
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        taxNumber: invoice.client.taxNumber,
        address: `${invoice.client.addressLine1 || ''}, ${invoice.client.city || ''}`,
      },
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: i.quantity.toString(),
        unitPrice: i.unitPrice.toString(),
        taxAmount: i.taxAmount.toString(),
        lineTotal: i.lineTotal.toString(),
      })),
      subtotalAmount: invoice.subtotalAmount.toString(),
      taxAmount: invoice.taxAmount.toString(),
      discountAmount: invoice.discountAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),
    };

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        frozenSnapshot,
      },
    });
  }
}
