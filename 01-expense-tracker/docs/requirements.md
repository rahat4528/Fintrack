# Expense Tracker Requirements & Specifications

## 1. Functional Scope

### 1.1 Account & Identity Management
- **User Authentication**: Secure user registration and login with bcrypt password hashing and JWT token issuance.
- **Financial Accounts**: Users manage multiple accounts of varying types:
  - `CASH`: Physical currency.
  - `CHECKING`: Transactional bank account.
  - `SAVINGS`: Dedicated savings account.
  - `CREDIT_CARD`: Revolving credit line.
  - `INVESTMENT`: Brokerage or asset account.
- **Account Archival**: Accounts containing transactions cannot be deleted; they may only be archived to preserve historical audit trails and reports.
- **Balance Invariant**: Account balances are derived from transaction history or updated atomically within transactions; reconciliation checks guarantee consistency.

### 1.2 Transaction Engine
- **Transaction Types**:
  - `INCOME`: Positive cash inflow into an account.
  - `EXPENSE`: Cash outflow from an account.
  - `TRANSFER`: Atomic balance shift from a source account to a destination account owned by the same user.
- **Core Attributes**: Description, amount (arbitrary-precision decimal), date, category, tags, and notes.
- **Soft Deletion**: Transactions are marked soft-deleted (`deletedAt`) to retain historical audit logs and allow rollback if required.
- **Query & Filtering**: Search across text, date intervals, amount bounds, category IDs, tags, and account IDs.

### 1.3 Recurring Transactions & Automation
- **Recurrence Patterns**: Daily, weekly, monthly, and yearly recurring schedules.
- **Idempotent Occurrence Generation**: Unique composite constraint on `(recurringId, occurrenceDate)` ensures retried jobs never create duplicate transactions.
- **Transaction Rules**: User-defined rules consisting of conditions (e.g., description contains string, amount threshold) and actions (set category, add tag) applied deterministically in user-specified priority order.

### 1.4 Financial Analytics & Reporting
- Income vs. Expense monthly aggregate bar charts.
- Category expenditure breakdown donut charts.
- Account balance progression over time.
- Cash-flow trend curves.
- Multi-currency isolation: balances and transactions in different currencies are never summed without explicit exchange conversion.

### 1.5 Data Ingestion & Portability
- **CSV Import**: Column mapping interface, preview stage, row-level validation, and duplicate detection via SHA-256 fingerprinting.
- **Import Batches**: Every import creates an `ImportBatch` allowing one-click rollback of all imported records.
- **CSV Export**: Standardized export of transactions, categories, and account states.
