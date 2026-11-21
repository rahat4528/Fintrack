# Phase 4 Architecture: Cryptocurrency Dashboard

## 1. Architecture Overview

The application is structured into decoupled components:
- **Frontend**: Next.js 14 App Router on port `3004`, dark-mode financial terminal styling with Tailwind CSS and Lucide icons.
- **Backend**: NestJS REST API on port `4004`, structured with dedicated modules for Market Data, Portfolio Tracking, Price Alerts, and Authentication.
- **Database**: PostgreSQL 16 on port `5434` (`fintrack_crypto_db`) with Prisma ORM.
- **Cache**: Redis 7 on port `6384` for market quote caching and rate-limiting.

```
+-------------------------------------------------------------+
|                 Next.js Frontend (Port 3004)                |
|  - Market Ticker & Screener                                 |
|  - Portfolio Dashboard (High-Precision Balance & PnL)       |
|  - Price Alert Rule Manager & Trigger Notifications         |
+------------------------------+------------------------------+
                               | REST API (HTTP)
+------------------------------v------------------------------+
|                   NestJS Backend (Port 4004)                |
|  +-------------------+  +-------------------+  +----------+ |
|  | MarketDataService |  | PortfolioService  |  | AlertSvc | |
|  +-------------------+  +-------------------+  +----------+ |
|  +--------------------------------------------------------+ |
|  |               Market Data Provider Adapter             | |
|  |       (CoinGecko API + TTL Cache + Stale Fallback)     | |
|  +--------------------------------------------------------+ |
+------------------+-----------------------+------------------+
                   |                       |
        +----------v-----------+   +-------v-------+
        |  PostgreSQL (5434)   |   |  Redis (6384) |
        |  fintrack_crypto_db  |   |  Market Cache |
        +----------------------+   +---------------+
```

## 2. High-Precision Mathematical Models
- Quantities: `Decimal(38, 18)`
- Fiat Prices: `Decimal(24, 8)`
- All arithmetic operations (`plus`, `minus`, `times`, `div`) executed with `Decimal.js` set to 38 digits precision and `ROUND_HALF_UP`.
