# Fintrack Stock Market Portfolio Tracker (Phase 6)

An institutional-grade equity investment tracking and analytics platform featuring tax-lot accounting (FIFO), corporate action adjustments (stock splits), money-weighted returns (XIRR), and asset allocation rebalancing, built on NestJS, PostgreSQL, Prisma, Redis, and Next.js.

---

## 1. Core Architecture & Highlights

- **FIFO Tax-Lot Accounting Engine**:
  - Each purchase opens a unique `TaxLot` with its own timestamp and acquisition price.
  - Liquidation automatically matches the oldest available lots (First-In, First-Out).
  - Explicit capital gain categorization: **Short-Term** (< 365 days) vs **Long-Term** (>= 365 days).
- **Corporate Action Split Invariant**:
  - Adjusts open tax lots and active positions upon forward or reverse stock splits.
  - Multiplies share count by split ratio and divides cost per share, guaranteeing that total invested cost basis is conserved to the cent.
- **Money-Weighted Returns (XIRR)**:
  - Solves the internal rate of return for irregular cash inflow/outflow streams using the Newton-Raphson method.
- **Target Asset Allocation & Rebalancing**:
  - Compares current sector weights against target percentages.
  - Identifies overweight and underweight sectors and generates exact dollar buy/sell recommendations.
- **Zero Float Drift**: Arbitrary precision calculations via `Decimal.js` and PostgreSQL `NUMERIC` types.

---

## 2. Port Allocation & Services

- **Frontend**: Port `3006` (Next.js 14 App Router, Institutional Investor UI)
- **Backend**: Port `4006` (NestJS REST API with OpenAPI/Swagger docs at `/api/docs`)
- **PostgreSQL**: Port `5436` (`fintrack_stocks_db`)
- **Redis**: Port `6386` (Market quotes cache & job broker)

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
Open [http://localhost:3006](http://localhost:3006) in your browser.

---

## 4. Automated Test Verification

Run the accounting invariants test suite:
```bash
cd backend
npm test
```
Verifies:
1. FIFO tax-lot liquidation order and short/long-term capital gains classification.
2. Forward stock split invariant (shares multiply, cost per share divides, total cost basis strictly conserved).
3. XIRR Newton-Raphson money-weighted return solver convergence.
4. Sector allocation rebalancing recommendations.
