# Phase 5 API Documentation: Invoice Management System

## Base URL
`http://localhost:4005/api/v1`

## Authentication
JWT Bearer token required in `Authorization: Bearer <token>` header for all business operations.

---

## Endpoints

### 1. Invoices
- `GET /invoices`
  - Query parameters: `status`, `clientId`, `search`.
  - Returns paginated list of invoices with current balance due and aging tag.
- `GET /invoices/:id`
  - Returns full invoice details with line items, payments, and frozen snapshot (if issued).
- `POST /invoices`
  - Body: `{ clientId: string, dueDate: string, items: Array<{ description, quantity, unitPrice, taxRateId?, productId? }>, notes?, terms?, discountAmount? }`
  - Creates a DRAFT invoice with atomically generated sequential invoice number.
- `PUT /invoices/:id`
  - Updates an existing invoice (ONLY permitted while status is `DRAFT`).
- `POST /invoices/:id/issue`
  - Transitions invoice from `DRAFT` to `SENT`.
  - Freezes immutable snapshot of client details, line items, and computed amounts.

### 2. Payments
- `POST /invoices/:id/payments`
  - Body: `{ amount: string, paymentMethod: string, reference?: string, notes?: string }`
  - Applies payment, reduces `balanceDue`, updates status to `PARTIALLY_PAID` or `PAID`.
- `GET /invoices/:id/payments`
  - Returns payment history for the invoice.

### 3. Accounts Receivable Aging
- `GET /aging/summary`
  - Returns aggregate accounts receivable divided into aging buckets:
    - `currentAmount`
    - `overdue1To30`
    - `overdue31To60`
    - `overdue61To90`
    - `overdue90Plus`
    - `totalOutstanding`

### 4. Quotations
- `GET /quotations`
  - Lists estimates and quotations.
- `POST /quotations`
  - Creates quotation.
- `POST /quotations/:id/convert`
  - Converts accepted quotation into an official draft invoice.

### 5. Clients & Catalog
- `GET /clients` / `POST /clients`
- `GET /products` / `POST /products`
- `GET /tax-rates` / `POST /tax-rates`
