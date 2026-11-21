# Fintrack Cryptocurrency Dashboard (Phase 4)

A high-precision, production-grade cryptocurrency market monitor and multi-asset portfolio accounting system built on NestJS, PostgreSQL, Prisma, Redis, and Next.js.

---

## 1. Core Architecture & Highlights

- **18-Decimal Arbitrary Precision**: Quantitative accounting designed for digital assets. Token quantities are stored as PostgreSQL `NUMERIC(38, 18)` and evaluated using `Decimal.js` (precision: 38 digits). Avoids JavaScript IEEE 754 float rounding errors on satoshis and wei.
- **Weighted Average Cost (WAC) Engine**:
  - Automatically recalculates cost basis across multiple BUY orders.
  - Computes exact realized profit/loss on partial token liquidations (SELL orders) and updates remaining invested capital.
  - Distinguishes realized versus unrealized PnL.
- **Resilient Market Adapter with Cache TTL**:
  - External provider adapter with Redis/in-memory 60s TTL cache.
  - Stale data detection: quotes older than TTL are labeled `isStale: true` with last known timestamp.
  - Deterministic fallback quotes for network resilience during rate limits or outages.
- **Price Alert Monitoring**: Configurable alerts for `PRICE_ABOVE` and `PRICE_BELOW` conditions with automated status transitions (`ACTIVE` -> `TRIGGERED`).

---

## 2. Port Allocation & Services

- **Frontend**: Port `3004` (Next.js 14 App Router, Dark Terminal UI)
- **Backend**: Port `4004` (NestJS REST API with OpenAPI/Swagger docs at `/api/docs`)
- **PostgreSQL**: Port `5434` (`fintrack_crypto_db`)
- **Redis**: Port `6384` (Market quotes cache & alert job broker)

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
Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## 4. Automated Test Verification

Run the automated mathematical invariants test suite:
```bash
cd backend
npm test
```
Verifies:
1. Exact 18-decimal addition, subtraction, and reversible calculations without floating point truncation.
2. Weighted average cost basis recalculation over multiple purchases.
3. Accurate realized PnL on partial liquidations with preservation of remaining cost basis.
4. Price alert condition trigger evaluation.
5. Cache TTL expiration and stale data labeling rules.
