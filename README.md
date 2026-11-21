# Fintrack

**Fintrack** is a curated suite of six independent, standalone, production-grade financial applications. Each application is built as an autonomous system featuring its own distinct domain model, database, backend services, frontend dashboard, configuration, test suites, and documentation.

---

## The Six Standalone Applications

1. **`01-expense-tracker` (Expense Tracker)**
   - *Purpose*: Personal expense and income tracking, account management, recurring transactions, categorization rules, CSV import/export, and cash-flow reporting.
   - *Key Capabilities*: Immutable transaction records, atomic account transfers, deterministic categorization rules, and balance reconciliation.

2. **`02-budget-planning-app` (Budget Planning App)**
   - *Purpose*: Zero-based envelope budgeting workspace for proactive financial allocation and planning.
   - *Key Capabilities*: Ready-to-assign invariant tracking, month-to-month envelope rollover, category transfers, debt payoff schedules, and offline-first persistence.

3. **`03-banking-application` (Banking Application)**
   - *Purpose*: Simulated core internet banking platform operating strictly with test accounts and simulated funds.
   - *Key Capabilities*: Strict double-entry general ledger, zero-sum transaction invariant, immutable audit trails, multi-role security (Customer, Employee, Admin), and automated statement generation.

4. **`04-cryptocurrency-dashboard` (Cryptocurrency Dashboard)**
   - *Purpose*: Digital asset market terminal, portfolio tracking, and price alert monitor.
   - *Key Capabilities*: Market data caching with rate limiting and TTL enforcement, high-precision crypto quantities, average cost-basis calculation, volatility indices, and stale data indicators.

5. **`05-invoice-management-system` (Invoice Management System)**
   - *Purpose*: Accounts receivable, billing, and document studio for freelancers and small businesses.
   - *Key Capabilities*: Sequential invoice numbering, immutable issued document snapshots, partial payment allocation, aging reports, credit note adjustments, and PDF generation.

6. **`06-stock-market-portfolio-tracker` (Stock Market Portfolio Tracker)**
   - *Purpose*: Long-term investment portfolio management, cost-basis accounting, dividend tracking, and asset performance analytics.
   - *Key Capabilities*: Tax-lot FIFO and average cost basis, realized versus unrealized gain separation, corporate action adjustments (stock splits), money-weighted return (XIRR), and rebalancing suggestions.

---

## System Architecture & Technical Foundation

Each application is architected around foundational financial engineering principles:
- **Financial Correctness**: Arbitrary-precision decimal arithmetic; strictly avoiding floating-point imprecision in financial balances, cost bases, and ledger entries.
- **Database Isolation**: Dedicated PostgreSQL databases per application (`fintrack_expense_db`, `fintrack_budget_db`, `fintrack_banking_db`, `fintrack_crypto_db`, `fintrack_invoice_db`, `fintrack_stocks_db`) with independent migration timelines.
- **Backend Architecture**: Modular NestJS backends providing type-safe REST APIs, structured DTO validation, and OpenAPI specifications.
- **Frontend Architecture**: Modern Next.js dashboards styled with Tailwind CSS, accessible component architectures, and responsive data visualizations.
- **Security & Auditing**: Role-based access controls, password hashing with Argon2/Bcrypt, session protection, idempotency enforcement on financial mutations, and immutable audit logs.

---

## Repository Directory Structure

```text
Fintrack/
├── README.md
├── LICENSE
├── PROGRESS.md
├── .gitignore
├── docs/
│   ├── repository-overview.md
│   ├── architecture.md
│   ├── technology-stack.md
│   ├── development-guide.md
│   ├── project-index.md
│   └── final-delivery-report.md
├── 01-expense-tracker/
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   ├── tests/
│   ├── docs/
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md
├── 02-budget-planning-app/
├── 03-banking-application/
├── 04-cryptocurrency-dashboard/
├── 05-invoice-management-system/
└── 06-stock-market-portfolio-tracker/
```

---

## Getting Started

Each application operates completely independently. To run any individual application, navigate to its directory:

```bash
cd 01-expense-tracker

# Start backing services (PostgreSQL, Redis)
docker-compose up -d

# Set up backend
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Set up frontend
cd ../frontend
npm install
npm run dev
```

Refer to each application's individual `README.md` for specific environment configuration and execution parameters.

---

## Disclaimers

The applications in this repository are software demonstrations. They do not constitute financial, investment, legal, or tax advice. The Banking Application operates exclusively with simulated money and demo accounts and does not connect to real-world banking rails.
