# Banking Application Requirements & Operational Boundaries

> **CRITICAL DISCLAIMER**: This application is a software demonstration internet-banking platform operating strictly with simulated money and test accounts. It is NOT a bank, credit union, or financial institution, and it never connects to real payment networks.

## 1. Role-Based Capabilities

### 1.1 Customer Experience
- Account overview (Savings and Current account types with generated account numbers: `SIM-XXXX-XXXX`).
- Real-time balance computed strictly from the double-entry general ledger.
- Internal simulated fund transfers with beneficiary validation, confirmation preview, and transfer reference codes.
- Transaction limits enforcement ($5,000 single transfer ceiling, $25,000 daily aggregate limit).
- Simulated bank statement generation with date filtering and PDF/CSV export.

### 1.2 Employee Operations Console
- Customer onboarding queue and KYC verification management using fake demo data.
- Account status controls (`ACTIVE`, `FROZEN`, `CLOSED`).
- Transaction monitoring dashboard for flagging suspicious patterns (rapid transfers, limit breaches).

### 1.3 Administrator Console
- System parameters configuration (daily limits, transfer fees, account types).
- User and role lifecycle management (`CUSTOMER`, `EMPLOYEE`, `ADMIN`).
- Immutable system audit trail inspecting all privileged operations with before and after state snapshots.

## 2. Invariants & Financial Security
1. **Double-Entry General Ledger**: Every transaction consists of balanced debits and credits that sum to zero:
   $$\sum \text{Debits} + \sum \text{Credits} = 0$$
2. **Ledger Immutability**: Ledger entries cannot be edited or deleted. Corrections are made solely via reversing journal entries.
3. **No Overdrafts**: A source account must have verified available ledger balance before any transfer executes.
4. **Idempotency Protection**: Repeated transfer submissions with the same idempotency key return the original processed transaction without re-executing.
