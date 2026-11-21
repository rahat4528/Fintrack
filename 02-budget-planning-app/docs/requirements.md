# Budget Planning App Requirements & Functional Blueprint

## 1. Core Purpose
Unlike retroactive personal accounting, the Budget Planning App focuses proactively on allocating available financial resources before spending occurs. Every monetary unit is assigned an explicit operational or savings purpose.

## 2. Core Functional Requirements

### 2.1 Ready-to-Assign Invariant
- **Fundamental Formula**:
  $$\text{ReadyToAssign} = \text{TotalOnBudgetIncome} + \text{InitialBalances} - \sum \text{AssignedToCategories}$$
- Money cannot be created out of thin air. Allocations reducing Ready-to-Assign below zero prompt a clear warning and require user confirmation of intentional negative allocation.

### 2.2 Envelope Budgeting Mechanics
- **Category Hierarchy**: Category Groups (e.g., Immediate Obligations, True Expenses, Quality of Life Goals) grouping individual budget categories.
- **Envelope Formula**: For each category $C$ in month $M$:
  $$\text{Available}(C, M) = \text{CarriedForward}(C, M-1) + \text{Assigned}(C, M) - \text{Activity}(C, M)$$
- **Zero-Sum Transfers**: Moving money between category envelopes updates both categories within an atomic transaction:
  $$\Delta \text{Available}(C_{\text{from}}) + \Delta \text{Available}(C_{\text{to}}) = 0$$

### 2.3 Overspending Policies
- **Cover Overspending**: Overspending can be covered immediately by moving funds from a surplus category.
- **Carry Forward**: Uncovered overspending is rolled into the subsequent month as a deduction from next month's starting Ready-to-Assign.

### 2.4 Debt Elimination Engine
- **Payoff Strategies**:
  - **Snowball**: Orders debts by smallest balance first to maximize psychological momentum.
  - **Avalanche**: Orders debts by highest APR first to minimize total interest paid.
- **Calculations**: Compares payoff horizons, monthly interest accrual with decimal precision, and total savings.

### 2.5 Event Log & Deterministic Replay
- Every allocation and fund transfer is stored as an immutable `BudgetEvent`.
- The current financial state can be completely recomputed by replaying the append-only event stream from inception.
