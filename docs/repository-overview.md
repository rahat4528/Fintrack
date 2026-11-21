# Fintrack Repository Overview

## 1. Executive Summary
Fintrack is an engineering repository hosting six independent, production-grade financial applications. Rather than merging disparate financial concepts into a single generic interface, Fintrack treats each distinct financial discipline as an autonomous software domain with its own data schema, business logic, user interface, and operational lifecycle.

## 2. Core Pillars

### 2.1 Complete Application Independence
Every project within the repository is self-contained. There are no shared packages, shared databases, or cross-project dependencies. Each application possesses:
- Dedicated Docker Compose definition with isolated container networking.
- Independent database schema, migrations, and seed scripts.
- Autonomous backend services running NestJS with strict module boundaries.
- Dedicated client interfaces built with Next.js and Tailwind CSS.
- Isolated test runners and documentation suites.

### 2.2 Uncompromising Financial Correctness
Financial calculations are governed by strict mathematical principles:
- **Zero Floating-Point Drift**: All currency values, unit costs, and fractional shares are stored and manipulated using arbitrary-precision decimal representations (PostgreSQL `NUMERIC` and decimal arithmetic libraries).
- **Explicit Currency Tracking**: Amounts carry explicit ISO 4217 currency designations or standard crypto asset identifiers. Conversion between currencies is never performed implicitly.
- **Strict Invariants**: Invariants such as double-entry balance equality, non-negative balances, zero-sum account transfers, and tax-lot depletion orders are enforced programmatically and verified through automated test suites.
- **Idempotency**: Critical balance-altering workflows utilize unique transaction keys to prevent duplicate executions from network retries.

### 2.3 Transparent Data Attribution
External market rates and information services operate behind robust abstraction adapters. Real-time data displays clearly distinguish between verified real-time feeds, delayed information, cached values, and local deterministic sample fixtures.
