# Phase 5 Architecture: Invoice Management System

## 1. Architecture Overview

The system consists of:
- **Frontend**: Next.js 14 App Router on port `3005`, clean professional billing studio with live invoice preview, aging charts, and PDF export preview.
- **Backend**: NestJS REST API on port `4005`, with dedicated modules for Clients, Invoices, Payments, Quotations, and Aging Analytics.
- **Database**: PostgreSQL 16 on port `5435` (`fintrack_invoice_db`) with Prisma ORM.
- **Cache / Queue**: Redis 7 on port `6385`.

```
+-------------------------------------------------------------+
|                 Next.js Frontend (Port 3005)                |
|  - Invoice Builder & Real-time Live Document Preview        |
|  - Accounts Receivable Aging Dashboard                      |
|  - Client Ledger & Payment Allocation Workspace             |
+------------------------------+------------------------------+
                               | REST API (HTTP)
+------------------------------v------------------------------+
|                   NestJS Backend (Port 4005)                |
|  +-------------------+  +-------------------+  +----------+ |
|  |  InvoicesService  |  |  PaymentsService  |  | AgingSvc | |
|  +-------------------+  +-------------------+  +----------+ |
|  +--------------------------------------------------------+ |
|  |           Sequential Numbering & Snapshot Freeze Engine| |
|  +--------------------------------------------------------+ |
+------------------+-----------------------+------------------+
                   |                       |
        +----------v-----------+   +-------v-------+
        |  PostgreSQL (5435)   |   |  Redis (6385) |
        |  fintrack_invoice_db |   |  Job Broker   |
        +----------------------+   +---------------+
```

## 2. Invariant Rules
1. **Invoice Immutability**: Any update to an invoice with status other than `DRAFT` throws `BadRequestException`.
2. **Consecutive Numbering**: Numbers strictly increment without gaps.
3. **Double Entry of Receivables**: Sum of line items + taxes - discounts = Total Due. Total Due - Total Payments = Balance Outstanding.
