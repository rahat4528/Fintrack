# Budget Planning App REST API Specification

Base URL: `http://localhost:4002/api/v1`

## 1. Authentication
- `POST /auth/register` — Register a budget owner.
- `POST /auth/login` — Authenticate and receive JWT token.
- `GET /auth/me` — Current user profile.

## 2. Budgets & Periods
- `GET /budgets` — List user budgets.
- `POST /budgets` — Create new budget workspace.
- `GET /budgets/:id` — Retrieve full budget details including category groups and current period.
- `GET /budgets/:id/periods/:year/:month` — Retrieve specific monthly period workspace and Ready-to-Assign calculation.

## 3. Allocations & Envelope Operations
- `POST /allocations` — Assign an amount to a category in a specific period.
- `POST /allocations/transfer` — Execute an atomic zero-sum fund transfer between two envelopes.
- `POST /allocations/auto-assign` — Apply automated budget suggestions based on historical averages.

## 4. Debt Planning Engine
- `GET /debt-plans` — List active debts and payoff configurations.
- `POST /debt-plans` — Add a debt record (creditor, balance, APR, minimum monthly payment).
- `GET /debt-plans/calculate` — Compare Snowball vs. Avalanche strategies (months to freedom, total interest).

## 5. Synchronization & Events
- `GET /sync/events` — Fetch new events since a sequence marker.
- `POST /sync/events` — Ingest client-side offline events with idempotency verification.
