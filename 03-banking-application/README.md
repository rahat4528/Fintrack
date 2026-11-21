# Fintrack Banking Application (Phase 3)

A production-grade, simulated commercial internet banking system and core double-entry ledger built on NestJS, PostgreSQL, Prisma, and Next.js.

> **CRITICAL DISCLAIMER**: This application is a strictly educational and simulated software banking demonstration. All accounts, routing numbers, customer names, transactions, and monetary balances are artificial sample records. This software does not connect to real banking networks, payment clearing houses, or financial institutions.

---

## 1. Domain Highlights & Capabilities

- **Strict Double-Entry Core Ledger**: Every money movement is an atomic balanced transaction with equal total debits and credits. Account balances are calculated dynamically from ledger entries or updated transactionally.
- **Arbitrary Precision Arithmetic**: Uses `Decimal.js` with `ROUND_HALF_UP` and PostgreSQL `NUMERIC(18,4)`. Zero JavaScript IEEE 754 floating-point numbers are used for financial balances.
- **Idempotent Transfer Pipeline**: Money transfers require an `Idempotency-Key` HTTP header. Duplicate submissions return the settled transaction receipt without duplicating debits or credits.
- **Role-Based Portals**:
  - **Customer Portal**: Account views (Checking, Savings, Foreign Currency), funds transfer, transaction history, statement generation.
  - **Employee Ops**: KYC document review (approve/reject), emergency account freeze/unfreeze, customer profile search.
  - **Admin & Compliance**: Automated transaction monitoring alerts, system transfer limits, cryptographic ledger audit trail.

---

## 2. Port Allocation & Architecture

- **Frontend**: Port `3003` (Next.js 14 App Router, Tailwind CSS)
- **Backend**: Port `4003` (NestJS REST API with OpenAPI/Swagger docs at `/api/docs`)
- **PostgreSQL**: Port `5433` (`fintrack_banking_db`)
- **Redis**: Port `6383` (Session cache & limit rate trackers)

---

## 3. Getting Started

### Prerequisites
- Node.js >= 20
- Docker and Docker Compose

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Configure Backend
```bash
cd backend
cp ../.env.example .env
npm install
npm run prisma:generate
npm run prisma:seed
npm run start:dev
```

### 3. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3003](http://localhost:3003) in your browser.

---

## 4. Automated Test Suite

Run the double-entry accounting and security test suite:
```bash
cd backend
npm test
```
Verifies:
1. Zero-sum debit and credit invariant.
2. Real-time balance equality against signed ledger entries.
3. Overdraft rejection on insufficient balance.
4. Idempotency deduplication preventing double-debits.
5. Role-based access control and account status freeze enforcement.
6. Mathematical statement reconciliation (`Opening + Credits - Debits == Closing`).
