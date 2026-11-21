import { PrismaClient, InvoiceStatus, QuotationStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 5: Invoice Management System...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Apex Consulting Solutions Ltd',
      taxNumber: 'GB-TAX-99823412',
      currency: 'USD',
      addressLine1: '400 Enterprise Boulevard, Suite 500',
      city: 'Austin',
      country: 'United States',
      invoicePrefix: 'INV-2026',
      nextInvoiceNum: 1005,
      quotePrefix: 'QT-2026',
      nextQuoteNum: 204,
    },
  });

  // 2. Create Billing Admin User
  const passwordHash = await bcrypt.hash('InvoicePro2026!', 10);
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'billing@fintrack-invoices.internal',
      passwordHash,
      fullName: 'Sarah Jenkins (Billing Manager)',
      role: 'OWNER',
    },
  });

  // 3. Create Tax Rates
  const vatStandard = await prisma.taxRate.create({
    data: {
      organizationId: org.id,
      name: 'Standard VAT 20%',
      ratePercent: new Decimal('20.00'),
    },
  });

  const salesTax = await prisma.taxRate.create({
    data: {
      organizationId: org.id,
      name: 'State Sales Tax 8.25%',
      ratePercent: new Decimal('8.25'),
    },
  });

  const zeroTax = await prisma.taxRate.create({
    data: {
      organizationId: org.id,
      name: 'Zero Rate 0%',
      ratePercent: new Decimal('0.00'),
    },
  });

  // 4. Create Product & Service Catalog
  const prodArch = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Enterprise Cloud Architecture Consulting',
      unitPrice: new Decimal('250.00'),
      sku: 'CONS-ARCH-01',
    },
  });

  const prodAudit = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Cybersecurity Penetration Testing & Audit',
      unitPrice: new Decimal('5000.00'),
      sku: 'SEC-AUDIT-02',
    },
  });

  const prodDev = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Full-Stack Software Engineering Retainer',
      unitPrice: new Decimal('180.00'),
      sku: 'ENG-RETAIN-03',
    },
  });

  // 5. Create Clients
  const clientAcme = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: 'Acme Global Industries LLC',
      email: 'finance@acme-global.sample',
      taxNumber: 'US-EIN-12-9876543',
      addressLine1: '100 Industrial Parkway',
      city: 'Chicago',
      country: 'United States',
    },
  });

  const clientNexis = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: 'Nexis Technology Partners',
      email: 'accounts@nexis-tech.sample',
      taxNumber: 'US-EIN-45-1234567',
      addressLine1: '75 Innovation Way',
      city: 'San Francisco',
      country: 'United States',
    },
  });

  const clientStarlight = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: 'Starlight Media Studios',
      email: 'payables@starlight-media.sample',
      taxNumber: 'US-EIN-88-7654321',
      addressLine1: '20 Sunset Boulevard',
      city: 'Los Angeles',
      country: 'United States',
    },
  });

  // 6. Create Seed Invoices

  // Invoice 1: INV-2026-1001 (SENT, Due in 15 days, Current aging)
  const now = new Date();
  const dueCurrent = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  const inv1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: clientAcme.id,
      invoiceNumber: 'INV-2026-1001',
      status: InvoiceStatus.SENT,
      issueDate: now,
      dueDate: dueCurrent,
      currency: 'USD',
      subtotalAmount: new Decimal('7500.00'),
      taxAmount: new Decimal('618.75'), // 8.25% on $7,500
      discountAmount: new Decimal('0.00'),
      totalAmount: new Decimal('8118.75'),
      amountPaid: new Decimal('0.00'),
      balanceDue: new Decimal('8118.75'),
      terms: 'Net 30 days',
      notes: 'Monthly enterprise architecture advisory retainer',
      frozenSnapshot: {
        clientName: 'Acme Global Industries LLC',
        clientAddress: '100 Industrial Parkway, Chicago',
        items: [
          { description: 'Enterprise Cloud Architecture Consulting (30 hrs)', qty: 30, rate: 250, total: 7500 },
        ],
        taxPercent: 8.25,
        totalDue: '8118.75',
      },
      items: {
        create: [
          {
            productId: prodArch.id,
            taxRateId: salesTax.id,
            description: 'Enterprise Cloud Architecture Consulting (30 hrs)',
            quantity: new Decimal('30.00'),
            unitPrice: new Decimal('250.00'),
            taxPercent: new Decimal('8.25'),
            taxAmount: new Decimal('618.75'),
            lineTotal: new Decimal('7500.00'),
          },
        ],
      },
    },
  });

  // Invoice 2: INV-2026-1002 (PARTIALLY_PAID, Nexis Tech)
  const inv2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: clientNexis.id,
      invoiceNumber: 'INV-2026-1002',
      status: InvoiceStatus.PARTIALLY_PAID,
      issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      subtotalAmount: new Decimal('10000.00'),
      taxAmount: new Decimal('2000.00'), // 20% VAT
      discountAmount: new Decimal('500.00'), // $500 promotional discount
      totalAmount: new Decimal('11500.00'),
      amountPaid: new Decimal('6000.00'),
      balanceDue: new Decimal('5500.00'),
      terms: 'Net 30 days',
      notes: 'Security audit and compliance certification',
      frozenSnapshot: {
        clientName: 'Nexis Technology Partners',
        totalDue: '11500.00',
      },
      items: {
        create: [
          {
            productId: prodAudit.id,
            taxRateId: vatStandard.id,
            description: 'Cybersecurity Penetration Testing & Audit (2 phases)',
            quantity: new Decimal('2.00'),
            unitPrice: new Decimal('5000.00'),
            taxPercent: new Decimal('20.00'),
            taxAmount: new Decimal('2000.00'),
            lineTotal: new Decimal('10000.00'),
          },
        ],
      },
    },
  });

  // Payment for Invoice 2
  await prisma.paymentRecord.create({
    data: {
      invoiceId: inv2.id,
      amount: new Decimal('6000.00'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      reference: 'WIRE-NEX-88902',
      notes: 'Initial 50% milestone payment',
    },
  });

  // Invoice 3: INV-2026-1003 (OVERDUE - 45 days overdue -> 31-60 days bucket)
  const overdueDueDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: clientStarlight.id,
      invoiceNumber: 'INV-2026-1003',
      status: InvoiceStatus.OVERDUE,
      issueDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      dueDate: overdueDueDate,
      currency: 'USD',
      subtotalAmount: new Decimal('3600.00'),
      taxAmount: new Decimal('0.00'),
      discountAmount: new Decimal('0.00'),
      totalAmount: new Decimal('3600.00'),
      amountPaid: new Decimal('0.00'),
      balanceDue: new Decimal('3600.00'),
      terms: 'Due upon receipt',
      notes: 'Urgent: Follow up on overdue accounts receivable',
      frozenSnapshot: {
        clientName: 'Starlight Media Studios',
        totalDue: '3600.00',
      },
      items: {
        create: [
          {
            productId: prodDev.id,
            taxRateId: zeroTax.id,
            description: 'Full-Stack Software Engineering Retainer (20 hrs)',
            quantity: new Decimal('20.00'),
            unitPrice: new Decimal('180.00'),
            taxPercent: new Decimal('0.00'),
            taxAmount: new Decimal('0.00'),
            lineTotal: new Decimal('3600.00'),
          },
        ],
      },
    },
  });

  // Invoice 4: INV-2026-1004 (DRAFT, editable)
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: clientAcme.id,
      invoiceNumber: 'INV-2026-1004',
      status: InvoiceStatus.DRAFT,
      issueDate: now,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      subtotalAmount: new Decimal('1800.00'),
      taxAmount: new Decimal('0.00'),
      discountAmount: new Decimal('0.00'),
      totalAmount: new Decimal('1800.00'),
      amountPaid: new Decimal('0.00'),
      balanceDue: new Decimal('1800.00'),
      items: {
        create: [
          {
            productId: prodDev.id,
            taxRateId: zeroTax.id,
            description: 'Sprint 14 Development Sprint',
            quantity: new Decimal('10.00'),
            unitPrice: new Decimal('180.00'),
            taxPercent: new Decimal('0.00'),
            taxAmount: new Decimal('0.00'),
            lineTotal: new Decimal('1800.00'),
          },
        ],
      },
    },
  });

  // 7. Create Quotation: QT-2026-0201
  await prisma.quotation.create({
    data: {
      organizationId: org.id,
      clientId: clientNexis.id,
      quoteNumber: 'QT-2026-0201',
      status: QuotationStatus.SENT,
      issueDate: now,
      expiryDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      totalAmount: new Decimal('15000.00'),
      items: [
        { description: 'Cloud Migration Phase 2', qty: 1, unitPrice: 10000, lineTotal: 10000 },
        { description: 'Staff Training & Handover (20 hrs)', qty: 20, unitPrice: 250, lineTotal: 5000 },
      ],
      notes: 'Valid for 14 business days from issuance',
    },
  });

  console.log('Phase 5 seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during Phase 5 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
