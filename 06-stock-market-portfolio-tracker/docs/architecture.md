# Phase 6 Architecture: Stock Market Portfolio Tracker

## 1. Architecture Overview

The system consists of:
- **Frontend**: Next.js 14 App Router on port `3006`, institutional investor workstation with interactive allocation charts, tax-lot tables, performance benchmarks, and rebalancing simulator.
- **Backend**: NestJS REST API on port `4006`, with dedicated modules for Securities, Tax Lots, Dividends, Corporate Actions, Performance Metrics (XIRR), and Rebalancing.
- **Database**: PostgreSQL 16 on port `5436` (`fintrack_stocks_db`) with Prisma ORM.
- **Cache**: Redis 7 on port `6386`.

```
+-------------------------------------------------------------+
|                 Next.js Frontend (Port 3006)                |
|  - Portfolio Dashboard & Benchmark Comparison Chart        |
|  - Tax-Lot Explorer (FIFO Matcher & Realized Gains)         |
|  - Asset Allocation Target & Rebalancing Engine             |
+------------------------------+------------------------------+
                               | REST API (HTTP)
+------------------------------v------------------------------+
|                   NestJS Backend (Port 4006)                |
|  +-------------------+  +-------------------+  +----------+ |
|  |  TaxLotsService   |  | PerformanceService|  |Rebalance | |
|  +-------------------+  +-------------------+  +----------+ |
|  +--------------------------------------------------------+ |
|  | Corporate Actions (Splits) & Decimal Precision Engine    | |
|  +--------------------------------------------------------+ |
+------------------+-----------------------+------------------+
                   |                       |
        +----------v-----------+   +-------v-------+
        |  PostgreSQL (5436)   |   |  Redis (6386) |
        |  fintrack_stocks_db  |   |  Market Cache |
        +----------------------+   +---------------+
```

## 2. Mathematical Integrity Rules
1. **Tax-Lot Conservation**: $\sum (\text{Lot Quantities}) = \text{Total Active Holding Quantity}$.
2. **Split Cost Conservation**: Split ratio multiplication must never alter the total invested cost basis by even 1 cent.
3. **Arbitrary Precision**: Decimal.js calculations for share quantities (up to 6 decimal places for fractional shares) and USD valuations.
