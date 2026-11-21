# Phase 6 Requirements: Stock Market Portfolio Tracker

## 1. Domain Objective
The Stock Market Portfolio Tracker is an independent institutional-grade equity and ETF investment tracking system. It provides comprehensive tax-lot accounting (FIFO, Specific Identification, and Average Cost), corporate action adjustments (forward/reverse stock splits), cash dividend recording, money-weighted return (XIRR) and time-weighted return (TWR) performance measurement, benchmark comparison against market indices, and portfolio asset allocation rebalancing.

## 2. Key Functional Requirements

### 2.1 Multi-Account & Multi-Currency Support
- Supports distinct account types: `TAXABLE_BROKERAGE`, `ROTH_IRA`, `TRADITIONAL_401K`, and `CUSTODIAL`.
- Supports primary trading currency (USD) and foreign asset holdings with explicit conversion exchange rates.

### 2.2 Tax-Lot Accounting Engine
- Each purchase creates a distinct `TaxLot` record with `originalQuantity`, `remainingQuantity`, `costBasisPerShare`, and `acquiredDate`.
- Upon liquidation (SELL):
  - **FIFO (First-In, First-Out)**: Automatically liquidates the oldest remaining tax lots.
  - Computes exact realized gain/loss:
    $$\text{Realized PnL} = \sum (\text{Sold Qty} \times (\text{Sale Price} - \text{Lot Cost Basis})) - \text{Commission}$$
  - Distinguishes **Short-Term** ($< 365\text{ days}$) vs **Long-Term** ($\ge 365\text{ days}$) capital gains.

### 2.3 Corporate Actions & Stock Splits
- Supports forward splits (e.g., 2-for-1, 10-for-1) and reverse splits (e.g., 1-for-5).
- Split invariant:
  $$\text{New Quantity} = \text{Old Quantity} \times \text{Split Ratio}$$
  $$\text{New Cost Basis Per Share} = \frac{\text{Old Cost Basis Per Share}}{\text{Split Ratio}}$$
  $$\text{Total Invested Cost} = \text{Constant (Unchanged)}$$

### 2.4 Dividend Tracking
- Records cash dividend distributions per share.
- Supports cash payout to broker account or Dividend Reinvestment (DRIP) into new fractional shares.

### 2.5 Performance Analytics & XIRR
- Calculates Internal Rate of Return with irregular cashflows (XIRR):
  $$\sum_{t=0}^N \frac{C_t}{(1 + \text{XIRR})^{\frac{d_t - d_0}{365}}} = 0$$
- Compares portfolio yield against a benchmark index (e.g. S&P 500 total return).

### 2.6 Target Asset Allocation & Rebalancing
- Users configure target sector weights (e.g., 40% Technology, 20% Healthcare, 20% Consumer, 20% Fixed Income).
- Compares current vs target percentages, identifying overweight/underweight positions and generating dollar-exact buy/sell rebalancing recommendations.
