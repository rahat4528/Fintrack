# Development & Contribution Guide

## 1. Prerequisites
- **Node.js**: v20+ LTS (Tested on Node.js v24)
- **Package Manager**: npm v10+
- **Docker & Docker Compose**: Docker Engine v24+
- **PostgreSQL**: Local instance or via provided Docker Compose definitions

## 2. Setting Up an Application
Because all applications are fully decoupled, you develop within an individual project directory:

```bash
# 1. Switch to the target application directory
cd 01-expense-tracker

# 2. Launch backing services (PostgreSQL, Redis)
docker-compose up -d

# 3. Configure environment variables
cp .env.example .env

# 4. Install backend dependencies and seed database
cd backend
npm install
npx prisma migrate dev --name init
npm run seed

# 5. Launch backend development server
npm run start:dev

# 6. In a separate terminal, install and launch frontend
cd ../frontend
npm install
npm run dev
```

## 3. Financial Development Guidelines
- Always represent monetary figures using decimal math (`Decimal.js`).
- Never perform arithmetic on native JavaScript floats.
- Ensure all multi-record ledger or transfer modifications execute inside explicit Prisma transactions.
- Always include automated tests asserting zero-drift calculations, boundary constraints, and idempotency protection.
