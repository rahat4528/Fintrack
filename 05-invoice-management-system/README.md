# Fintrack Invoice Management System (Phase 5)

A professional billing, invoicing, and accounts receivable studio designed for small and medium businesses, built on NestJS, PostgreSQL, Prisma, Redis, and Next.js.

---

## 1. Core Architecture & Highlights

- **Sequential Invoice Numbering**: Numbers are allocated atomically inside database transactions (`INV-YYYY-XXXX`) to guarantee zero duplicate numbers or gap anomalies.
- **Frozen Immutable Snapshots**:
  - DRAFT invoices are editable.
  - Upon issuance (`SENT` status), an immutable JSON snapshot captures client details, billing address, line items, and tax rates.
  - Subsequent client profile or catalog price edits NEVER alter historical issued invoices. Corrections require a `CreditNote`.
- **Arbitrary Precision Arithmetic**: Uses `Decimal.js` with `ROUND_HALF_UP` and PostgreSQL `NUMERIC(15, 2)`. Ensures zero rounding drift across multiple line items, multi-tax calculations, and partial payment applications.
- **Progressive Payment Allocation**: Partial and full payments reduce invoice `balanceDue` dynamically while updating status (`PARTIALLY_PAID` or `PAID`) and preventing overpayments.
- **Accounts Receivable Aging Engine**: Categorizes unpaid receivables into industry standard aging brackets: Current (not due), 1-30, 31-60, 61-90, and 90+ days overdue.
- **Quotation Workflow**: Create quotes and convert them to draft invoices with 1 click.

---

## 2. Port Allocation & Services

- **Frontend**: Port `3005` (Next.js 14 App Router, Billing Studio)
- **Backend**: Port `4005` (NestJS REST API with OpenAPI/Swagger docs at `/api/docs`)
- **PostgreSQL**: Port `5435` (`fintrack_invoice_db`)
- **Redis**: Port `6385` (Job queue & payment session cache)

---

## 3. Getting Started

### Prerequisites
- Node.js >= 20
- Docker and Docker Compose

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Setup Backend
```bash
cd backend
cp ../.env.example .env
npm install
npm run prisma:generate
npm run prisma:seed
npm run start:dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 4. Automated Test Verification

Run the accounting invariants test suite:
```bash
cd backend
npm test
```
Verifies:
1. Multi-tax and discount calculation without floating point drift.
2. Contiguous sequential invoice numbering without sequence gaps.
3. Partial payment allocation and balance due reduction with overpayment prevention.
4. Frozen snapshot immutability (prohibiting modifications on issued invoices).
5. Accounts receivable aging bucket categorization (Current, 1-30, 31-60, 61-90, 90+).
