# Fintrack Project Index

A centralized registry of all applications, their designated ports, primary databases, and current operational status.

| Directory | Application Name | Port (FE/BE) | Database Name | Status |
|---|---|---|---|---|
| `01-expense-tracker` | Expense Tracker | 3001 / 4001 | `fintrack_expense_db` | Completed |
| `02-budget-planning-app` | Budget Planning App | 3002 / 4002 | `fintrack_budget_db` | Completed |
| `03-banking-application` | Banking Application | 3003 / 4003 | `fintrack_banking_db` | Planned |
| `04-cryptocurrency-dashboard` | Cryptocurrency Dashboard | 3004 / 4004 | `fintrack_crypto_db` | Planned |
| `05-invoice-management-system` | Invoice Management System | 3005 / 4005 | `fintrack_invoice_db` | Planned |
| `06-stock-market-portfolio-tracker` | Stock Market Portfolio Tracker | 3006 / 4006 | `fintrack_stocks_db` | Planned |

---

## Port Allocation Strategy
To allow developers to run multiple applications simultaneously if desired, each application is allocated a dedicated non-conflicting port range:
- `01-expense-tracker`: Frontend `3001`, Backend `4001`, PostgreSQL `5431`
- `02-budget-planning-app`: Frontend `3002`, Backend `4002`, PostgreSQL `5432`
- `03-banking-application`: Frontend `3003`, Backend `4003`, PostgreSQL `5433`
- `04-cryptocurrency-dashboard`: Frontend `3004`, Backend `4004`, PostgreSQL `5434`
- `05-invoice-management-system`: Frontend `3005`, Backend `4005`, PostgreSQL `5435`
- `06-stock-market-portfolio-tracker`: Frontend `3006`, Backend `4006`, PostgreSQL `5436`
