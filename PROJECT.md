# Project: Workflow Audit

## Architecture
- Framework: Next.js 16 + React 19
- Language: TypeScript 5
- Core Libraries: TanStack React Query, Zustand, React Hook Form, Zod, Radix UI, Shadcn, js-cookie, Axios, next-intl, Tailwind CSS 4

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Code Audit | Deep static analysis of codebase for R1, R2, R3 | None | IN_PROGRESS |
| 2 | Automated Tool Execution | Running tsc, next lint, and bundle analyzer | None | IN_PROGRESS |
| 3 | Forensic Integrity Check | Verify authenticity of results and check for violations | M1, M2 | PLANNED |
| 4 | Final Reporting & Synthesis | Compile final report in Arabic and present to user | M1, M2, M3 | PLANNED |

## Code Layout
- `.agents/` - Agent metadata and handoffs
- `src/` - Main source code directory
  - `src/app/` - Next.js App Router pages and layouts
  - `src/components/` - Shared UI and layout components
  - `src/hooks/` - Custom React hooks
  - `src/lib/` - Libraries, utilities, API clients, state management stores
  - `src/middleware.ts` - Middleware (auth, routing, next-intl)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
