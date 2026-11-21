# Phase 5 Requirements: Invoice Management System

## 1. Domain Objective
The Invoice Management System is an independent billing, invoicing, and accounts receivable system engineered for small and medium enterprises. It guarantees deterministic financial calculations, immutability of issued documents, sequential invoice numbering, flexible tax/discount structures, partial payment reconciliation, and real-time aging reports.

## 2. Key Functional Requirements

### 2.1 Sequential Invoice Numbering
- Invoices must be sequentially numbered per business organization (e.g. `INV-2026-0001`, `INV-2026-0002`).
- Number generation must be protected by database transactions with row-level locking or atomic sequences to prevent gaps or duplicate numbers under concurrent creation.

### 2.2 Frozen Snapshot Upon Issuance
- While in `DRAFT` status, line items, customer details, tax rates, and prices can be edited.
- Once status transitions to `SENT` or `PAID`, the invoice is immutable:
  - A complete JSON snapshot of all customer details, billing addresses, line items, tax rates, and discounts is permanently frozen.
  - Future changes to customer profiles or product catalog prices NEVER alter historical invoices.
  - Any post-issuance correction requires a compensating `CreditNote`, not a silent update.

### 2.3 Mathematical Precision & Tax Calculations
- Line item total:
  $$\text{Line Net} = \text{Quantity} \times \text{Unit Price} - \text{Discount}$$
- Supports line-level and invoice-level taxes (e.g. standard VAT, GST, state sales tax).
- All calculations executed via `Decimal.js` with `ROUND_HALF_UP` and PostgreSQL `NUMERIC(15, 2)`.

### 2.4 Partial Payment Allocation & Status Tracking
- Payments can be recorded against an issued invoice in partial or full increments.
- Total paid cannot exceed total invoice due amount.
- Status transitions:
  - `DRAFT` -> `SENT` -> `PARTIALLY_PAID` -> `PAID` -> `VOID` -> `REFUNDED`

### 2.5 Accounts Receivable Aging Reports
- Real-time aging bucket categorization based on `dueDate`:
  - **Current**: Not yet due ($t \le \text{dueDate}$)
  - **1 - 30 Days**: Overdue by 1 to 30 days
  - **31 - 60 Days**: Overdue by 31 to 60 days
  - **61 - 90 Days**: Overdue by 61 to 90 days
  - **90+ Days**: Overdue by more than 90 days

### 2.6 Quotation & Approval Workflow
- Create estimates / quotations.
- Convert approved quotation into an official invoice with a single action.
