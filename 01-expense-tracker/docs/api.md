# Expense Tracker REST API Specification

Base URL: `http://localhost:4001/api/v1`

## 1. Authentication
- `POST /auth/register` — Register a new user profile with email and password.
- `POST /auth/login` — Authenticate credentials and receive a JWT Bearer token.
- `GET /auth/me` — Retrieve the authenticated user profile.

## 2. Financial Accounts
- `GET /accounts` — List all accounts for the authenticated user (includes archived toggle).
- `POST /accounts` — Create an account (name, type, currency, opening balance).
- `GET /accounts/:id` — Retrieve details for a specific account.
- `PATCH /accounts/:id` — Update account metadata or archive status.
- `GET /accounts/:id/reconciliation` — Compare stored balance with raw transaction sum.

## 3. Transactions
- `GET /transactions` — Paginated list of transactions with extensive filtering (date, amount, category, account, text).
- `POST /transactions` — Create an income or expense transaction.
- `POST /transactions/transfer` — Execute an atomic transfer between two owned accounts.
- `GET /transactions/:id` — Retrieve transaction details.
- `PATCH /transactions/:id` — Modify a transaction (with automatic paired-transfer updates).
- `DELETE /transactions/:id` — Soft-delete a transaction.

## 4. Categories & Tags
- `GET /categories` — List custom categories.
- `POST /categories` — Create category (name, color, icon, parentCategoryId).
- `GET /tags` — List all tags.
- `POST /tags` — Create a new tag.

## 5. Rules & Recurring Schedules
- `GET /rules` — List transaction rules ordered by priority.
- `POST /rules` — Create a rule (conditions, actions, priority).
- `POST /rules/evaluate` — Test rule evaluation on sample payload or apply retroactively.
- `GET /recurring` — List recurring transaction definitions.
- `POST /recurring` — Define a recurring schedule (frequency, start date, next run date).
- `POST /recurring/process` — Trigger generation of pending occurrences (idempotent).

## 6. Reports & Portability
- `GET /reports/summary` — Overview metrics: total income, total expenses, net savings rate.
- `GET /reports/category-breakdown` — Category spending aggregates for a date range.
- `GET /reports/monthly-trends` — Month-by-month cash flow analysis.
- `POST /import/csv/preview` — Upload and preview mapped CSV records with validation warnings.
- `POST /import/csv/commit` — Ingest validated records into an `ImportBatch`.
- `POST /import/batch/:id/undo` — Reverse all transactions associated with an import batch.
- `GET /export/csv` — Stream CSV export of transaction records.
