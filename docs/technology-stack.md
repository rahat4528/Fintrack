# Technology Stack & Selection Rationale

## 1. Selected Technologies Across All Applications

### Backend Foundation: NestJS (Node.js & TypeScript)
- **Rationale**: NestJS provides an enterprise-grade architectural backbone featuring modular encapsulation, native dependency injection, decorators for request validation, structured middleware for authentication/authorization, and automatic OpenAPI generation.
- **TypeScript (Strict Mode)**: Eliminates type ambiguity across financial data contracts, ensuring amount fields, currency codes, and status enums are validated at compile-time.

### Frontend Foundation: Next.js & React
- **Rationale**: Next.js App Router delivers server-side rendering for data density and instant page loads, combined with responsive client-side hydration for dynamic chart updates, live filter tables, and complex form editors.
- **Styling**: Tailwind CSS enables consistent, responsive design systems tailored to each application's unique visual identity.

### Persistence Layer: PostgreSQL & Prisma ORM
- **Rationale**: PostgreSQL provides industry-standard ACID guarantees, native `NUMERIC` data types for arbitrary-precision arithmetic, and robust constraint checking. Prisma provides type-safe query generation, reliable migration workflows, and introspectable schema definitions.

### Asynchronous Operations: Redis & BullMQ
- **Rationale**: Used for recurring transaction processing, scheduled price refreshes, invoice reminder dispatches, and alert evaluations with guaranteed idempotency and concurrency controls.

### Charting & Analytics: Recharts
- **Rationale**: Declarative, composable SVG charting capable of rendering dense time-series, cash-flow breakdowns, asset allocation donuts, and benchmark overlays.
