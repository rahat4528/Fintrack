# Phase 4 Requirements: Cryptocurrency Dashboard

## 1. Domain Objective
The Cryptocurrency Dashboard is an independent market monitoring and portfolio accounting system designed for digital assets. It provides real-time market snapshots, historical candlestick data, multi-asset portfolio tracking with average cost basis accounting, customizable price threshold alerts, and an external provider adapter with resilience fallbacks.

## 2. Key Functional Requirements

### 2.1 High-Precision Quantity & Pricing Architecture
- Digital assets require up to 18 decimal places of precision (e.g., satoshis, wei).
- Database fields must use PostgreSQL `NUMERIC(38, 18)` for quantities and `NUMERIC(24, 8)` for unit prices.
- Node.js calculation engine must use `Decimal.js` to ensure zero floating-point arithmetic errors.

### 2.2 Market Data Ingestion & Caching
- Connects through an external provider adapter interface (e.g. CoinGecko public API).
- Caches responses in Redis / in-memory with a documented TTL (e.g., 60 seconds).
- Displays explicit timestamps (`lastUpdated`) on all quotes and charts.
- When the external provider is unreachable or rate-limited, the system falls back to cached quotes flagged as `isStale: true` and deterministic fallback fixtures.

### 2.3 Portfolio & Holdings Accounting
- Supports multiple portfolios per user (e.g., "Cold Storage", "DeFi Holdings", "Active Trading").
- Implements Weighted Average Cost (WAC) basis for holdings:
  $$\text{Average Cost} = \frac{\sum (\text{Buy Quantity} \times \text{Buy Price})}{\sum \text{Buy Quantity}}$$
- Tracks realized vs unrealized profit and loss (PnL) with percentage yields.

### 2.4 Watchlist & Price Alerts
- Users can create watchlists with priority sorting.
- Configurable price alerts:
  - `PRICE_ABOVE`: Triggers when current spot price exceeds target.
  - `PRICE_BELOW`: Triggers when spot price drops below target.
  - `PERCENT_CHANGE_24H`: Triggers when 24h volatility exceeds threshold.

### 2.5 Security & Privacy
- User authentication via JWT with bcrypt password hashing.
- Strict ownership isolation: users can only view and modify their own portfolios, transactions, and alert rules.
