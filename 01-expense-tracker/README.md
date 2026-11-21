# Expense Tracker (`01-expense-tracker`)

A production-grade, personal financial tracking system engineered for arbitrary-precision bookkeeping, atomic account transfers, deterministic categorization rules, and cash-flow reporting.

---

## 1. Feature Overview

- **Account Management**: Supports cash, checking, savings, credit card, and investment accounts with explicit currency boundaries and immutable archival protection.
- **Transaction Engine**: Records income, expenses, and paired transfers with soft-delete capabilities, metadata tagging, and granular search filters.
- **Atomic Transfers**: Atomic two-legged balance transfers between accounts owned by the same user, preventing money creation or loss under failure.
- **Balance Reconciliation**: Continuous reconciliation checks comparing stored balances with raw transaction totals to prevent and heal drift.
- **Recurring Schedules**: Idempotent recurring transaction generator using unique composite keys (`recurringId`, `occurrenceDate`) to eliminate duplicate occurrences on job retries.
- **Categorization Rule Engine**: Predicate-action rule execution engine evaluated in priority order (`SET_CATEGORY`, `ADD_TAG`, `SET_DESCRIPTION`).
- **CSV Ingestion & Portability**: Duplicate detection via SHA-256 transaction content hashing, preview mapping, batch-level undo rollback, and CSV streaming export.
- **Budget Alerts & Goals**: Monthly category spending limit monitors and multi-milestone savings goal tracking.

---

## 2. Technology Stack & Design Rationale

- **Backend**: NestJS (Node.js & TypeScript) with modular encapsulation, validation pipes, and global exception filters.
- **Frontend**: Next.js (App Router, React 18, Tailwind CSS, Lucide icons) delivering a calm personal-finance interface.
- **Database**: PostgreSQL (`fintrack_expense_db` on port 5431) with Prisma ORM.
- **Arithmetic Engine**: `Decimal.js` configuring 28-digit precision and `ROUND_HALF_UP` rounding to guarantee zero floating-point drift.
- **Job Queue**: Redis (port 6381) and BullMQ for scheduled recurring transaction execution.

---

## 3. Financial Rules & Precision Policy

- **No Float Usage**: Native JavaScript `Number` floating-point types are prohibited for financial balances, amounts, and rates. All math uses `DecimalUtil`.
- **Database Storage**: PostgreSQL `NUMERIC(15, 2)` for fiat amounts and `NUMERIC(18, 6)` for exchange rates.
- **Rounding Mode**: `ROUND_HALF_UP` applied at final calculation boundaries.
- **Atomic Transfers**: Transfers are executed inside database transactions:
  $$\text{Debit}(A_{\text{source}}) + \text{Credit}(A_{\text{dest}}) = 0$$

---

## 4. Getting Started

### 4.1 Prerequisites
- Node.js v20+ LTS
- Docker and Docker Compose

### 4.2 Start Infrastructure Services
```bash
docker-compose up -d
```

### 4.3 Backend Setup & Database Migration
```bash
cd backend
npm install
npx prisma migrate dev --name init --schema=../database/schema.prisma
npm run prisma:seed
npm run start:dev
```
The backend API starts on `http://localhost:4001` with Swagger docs at `http://localhost:4001/api/docs`.

### 4.4 Frontend Dashboard Setup
```bash
cd ../frontend
npm install
npm run dev
```
Access the client dashboard at `http://localhost:3001`.

---

## 5. Running Automated Tests

Run the test suite from the backend directory:
```bash
cd backend
npm test
```

Test coverage includes:
- Decimal arithmetic edge cases (e.g. $0.1 + 0.2 = 0.30$)
- Invariant preservation across multi-account transfers
- Idempotent recurring occurrence generation
- Rule priority ordering and deterministic evaluation
- CSV duplicate fingerprinting and batch undo balance restoration

---

## 6. Disclaimers

This application is provided for demonstration and personal record-keeping purposes only. It does not constitute financial, investment, accounting, or tax advice.
