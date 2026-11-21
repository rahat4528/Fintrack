# Phase 6 API Documentation: Stock Market Portfolio Tracker

## Base URL
`http://localhost:4006/api/v1`

## Authentication
JWT Bearer token required in `Authorization: Bearer <token>` header for all portfolio and trade endpoints.

---

## Endpoints

### 1. Accounts & Portfolios
- `GET /portfolios`
  - Returns authenticated user's investment accounts (Taxable, Roth IRA, 401k) with current valuations, cost basis, unrealized gain, and YTD performance.
- `POST /portfolios`
  - Creates a new portfolio account container.
- `GET /portfolios/:id`
  - Detailed portfolio breakdown with active positions and tax lots.

### 2. Transactions & Tax Lots
- `POST /portfolios/:id/transactions`
  - Body: `{ symbol: string, type: 'BUY' | 'SELL' | 'DIVIDEND', shares: string, pricePerShare: string, commission?: string, transactedAt?: string, matchingMethod?: 'FIFO' | 'AVERAGE_COST' }`
  - Executes trade. For SELL orders, matches tax lots using selected strategy (defaults to FIFO) and outputs realized capital gain with short/long-term classification.
- `GET /portfolios/:id/tax-lots`
  - Lists open tax lots with remaining quantities and unrealized gains per lot.
- `GET /portfolios/:id/realized-gains`
  - Lists closed tax lot sales with realized capital gains.

### 3. Corporate Actions (Stock Splits)
- `POST /corporate-actions/split`
  - Body: `{ symbol: string, splitRatio: number, effectiveDate: string }`
  - Applies stock split across all user accounts: scales shares by `splitRatio`, divides cost basis per share by `splitRatio`, preserving total cost basis.

### 4. Dividends
- `POST /portfolios/:id/dividends`
  - Body: `{ symbol: string, grossAmount: string, reinvested: boolean, sharesPurchased?: string }`
  - Records cash dividend or DRIP.

### 5. Performance & Analytics
- `GET /portfolios/:id/performance`
  - Computes Money-Weighted Return (XIRR) and Time-Weighted Return (TWR) compared with S&P 500 benchmark.
- `GET /portfolios/:id/rebalance`
  - Evaluates current sector weights against target asset allocation and outputs rebalancing trades.
