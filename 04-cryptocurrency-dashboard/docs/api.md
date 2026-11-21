# Phase 4 API Documentation: Cryptocurrency Dashboard

## Base URL
`http://localhost:4004/api/v1`

## Authentication
JWT Bearer token required in `Authorization: Bearer <token>` header for all portfolio and alert endpoints.

---

## Endpoints

### 1. Market Data
- `GET /market/tickers`
  - Returns current spot quotes for top cryptocurrencies.
  - Returns `{ symbol, name, priceUsd, change24h, volume24h, marketCapUsd, lastUpdated, isStale }`.
- `GET /market/tickers/:symbol`
  - Detailed quote and 24-hour summary.
- `GET /market/history/:symbol?days=30`
  - Historical daily prices / candlestick data.

### 2. Portfolio Management
- `GET /portfolios`
  - Lists authenticated user's portfolios with aggregate current valuation, invested cost, and unrealized PnL.
- `POST /portfolios`
  - Body: `{ name: string, description?: string }`
  - Creates a new portfolio container.
- `GET /portfolios/:id`
  - Detailed portfolio breakdown with individual asset holdings.
- `POST /portfolios/:id/transactions`
  - Body: `{ symbol: string, type: 'BUY' | 'SELL', quantity: string, unitPriceUsd: string, feeUsd?: string, transactedAt: string }`
  - Records transaction, recalculates weighted average cost basis and holding quantities.

### 3. Price Alerts
- `GET /alerts`
  - Lists active and triggered alerts for the user.
- `POST /alerts`
  - Body: `{ symbol: string, condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE_24H', targetValue: string }`
  - Sets a new price monitoring trigger.
- `DELETE /alerts/:id`
  - Cancels an alert.

### 4. Watchlist
- `GET /watchlist`
  - User's pinned tokens.
- `POST /watchlist/:symbol`
  - Add token to watchlist.
- `DELETE /watchlist/:symbol`
  - Remove token from watchlist.
