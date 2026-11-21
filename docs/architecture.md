# System Architecture

## 1. Architectural Philosophy
The Fintrack monorepo deliberately employs a **Multi-Project Independent Architecture** rather than a shared microservices mesh or distributed monorepo. This guarantees that each financial app remains completely decoupled, avoiding cross-application blast radius, schema coupling, and cascading failures.

## 2. Standardized Application Anatomy
Each project folder adheres to a uniform internal structure:

```text
<project-folder>/
├── backend/            # NestJS API application
│   ├── src/
│   │   ├── modules/    # Domain-driven NestJS modules
│   │   ├── common/     # Filters, guards, pipes, decimal helpers
│   │   └── main.ts     # Application bootstrap
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # Next.js App Router UI
│   ├── src/
│   │   ├── app/        # Page routes and layouts
│   │   ├── components/ # Atomic and domain UI components
│   │   └── lib/        # API clients, formatters, state hooks
│   ├── package.json
│   └── tailwind.config.js
├── database/           # Data layer assets
│   ├── schema.prisma   # Prisma schema definitions
│   ├── migrations/     # Version-controlled SQL migrations
│   └── seed.ts         # Deterministic seed data generator
├── tests/              # End-to-end and cross-cutting test suites
├── docs/               # Local requirements, API specs, and completion logs
├── docker-compose.yml  # Local database, cache, and storage containers
├── .env.example        # Environment variable specification
└── README.md           # Application-specific operational manual
```

## 3. Financial Data Integrity Layer
1. **Decimal Precision**: In both Prisma models and application memory, calculations use `Decimal.js` instances. Javascript native floating-point math is strictly forbidden.
2. **Transaction Isolation**: Multi-table updates (such as transfers, ledger movements, and invoice payment allocations) execute inside database transactions (`SERIALIZABLE` or `READ COMMITTED` with explicit row locking where appropriate).
3. **Audit Trails**: All state mutations affecting monetary positions produce immutable audit records detailing the acting identity, timestamp, prior state, and new state.
