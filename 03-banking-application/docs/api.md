# Banking Application REST API Specification

Base URL: `http://localhost:4003/api/v1`

## 1. Authentication & Security
- `POST /auth/register` — Register a customer with simulated identity.
- `POST /auth/login` — Authenticate and receive JWT Bearer token with embedded role claims (`CUSTOMER`, `EMPLOYEE`, `ADMIN`).
- `GET /auth/me` — Retrieve active profile and permissions.

## 2. Customer Banking Endpoints
- `GET /accounts` — List bank accounts owned by the authenticated customer.
- `GET /accounts/:id/ledger` — Paginated immutable ledger entries for an account.
- `GET /accounts/:id/reconciliation` — Compare cached balance with sum of debits and credits.
- `POST /transfers/quote` — Validate transfer parameters, check daily limits, and return preview quote.
- `POST /transfers/execute` — Execute double-entry transfer (requires `Idempotency-Key` header).
- `GET /beneficiaries` — List verified demo beneficiaries.
- `POST /beneficiaries` — Add beneficiary by account number with verification check.
- `GET /statements/:accountId` — Generate simulated statement with PDF download link.

## 3. Employee Operations Console
- `GET /employee/kyc-queue` — View pending customer KYC verification records.
- `PATCH /employee/kyc/:id/review` — Approve or reject KYC status with audit reason.
- `PATCH /employee/accounts/:id/status` — Set account status (`ACTIVE`, `FROZEN`, `CLOSED`).
- `GET /employee/monitoring-alerts` — List high-velocity or limit-breach transaction alerts.

## 4. Administrator Console
- `GET /admin/users` — User registry with role assignments.
- `PATCH /admin/users/:id/role` — Promote or demote user roles.
- `GET /admin/limits` — System-wide transfer limit configurations.
- `PATCH /admin/limits` — Update daily limits or transaction fee schedules.
- `GET /admin/audit-logs` — Immutable audit log explorer.
