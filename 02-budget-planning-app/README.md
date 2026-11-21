# Budget Planning App (`02-budget-planning-app`)

A zero-based envelope budgeting workspace and debt elimination planning application designed to allocate available money before spending occurs.

---

## 1. Feature Overview

- **Ready-to-Assign Conservation**: Enforces the zero-based budgeting invariant ensuring every dollar of income and starting balance is allocated without creating phantom funds.
- **Envelope Budgeting Grid**: Dynamic monthly grid organizing category groups, individual envelopes, assigned amounts, actual spending activity, and available remaining funds.
- **Zero-Sum Envelope Transfers**: Shift funds between envelopes atomically:
  $$\Delta \text{Available}(C_1) + \Delta \text{Available}(C_2) = 0$$
- **Overspending Policies**: Visual overspend badges with automatic carry-forward deductions into subsequent monthly periods.
- **Debt Elimination Engine**: Mathematical simulation comparing Snowball (smallest balance first) and Avalanche (highest APR first) payoff strategies using decimal interest accrual.
- **Bill Calendar & Cash Projections**: Projects upcoming recurring commitments across 30, 60, and 90-day cash horizons.
- **Append-Only Event Sourcing**: All allocations, transfers, and income adjustments append to an immutable `BudgetEvent` stream enabling deterministic state replay.

---

## 2. Technology Stack & Design Rationale

- **Backend**: NestJS (TypeScript, Node.js v24) providing structured domain modules, validation pipes, and OpenAPI Swagger documentation at `/api/docs`.
- **Frontend**: Next.js App Router, React 18, Tailwind CSS, Lucide icons, responsive envelope grid workspace.
- **Database**: PostgreSQL (`fintrack_budget_db` on Port 5432) with Prisma ORM.
- **Arithmetic Engine**: `Decimal.js` configuring 28-digit precision and `ROUND_HALF_UP` rounding.
- **Cache**: Redis (Port 6382).

---

## 3. Financial Rules & Precision Policy

- **No Float Arithmetic**: All allocations, available balances, debt balances, and interest rates use arbitrary-precision decimal operations (`DecimalUtil`).
- **Storage Precision**: Stored as PostgreSQL `NUMERIC(15, 2)` for amounts and `NUMERIC(5, 2)` for APR interest percentages.
- **Conservation Formula**:
  $$\text{ReadyToAssign} = \text{TotalIncome} + \text{StartingBalance} - \sum \text{Assigned}$$

---

## 4. Getting Started

### 4.1 Prerequisites
- Node.js v20+ LTS
- Docker & Docker Compose

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
Backend API will listen on `http://localhost:4002`.

### 4.4 Frontend Dashboard Setup
```bash
cd ../frontend
npm install
npm run dev
```
Client workspace runs on `http://localhost:3002`.

---

## 5. Automated Tests

Execute the invariant and business rules test suite:
```bash
cd backend
npm test
```

Test coverage includes:
- Ready-to-assign invariant conservation across randomized allocations
- Zero-sum envelope transfers
- Available balance formulas and overspending carry-forward
- Append-only event log replay determinism
- Debt payoff simulation (Snowball vs. Avalanche)
- Leap year date boundary calculations

---

## 6. Disclaimers

This software is for demonstration and personal budgeting purposes only and does not constitute financial, debt consolidation, or investment advice.
