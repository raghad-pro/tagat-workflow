# Plan for Next.js 16 / React 19 Project Audit

## Steps
1. **Initial Assessment and Setup** [done]
   - Record user request and initialize BRIEFING.md and progress.md
   - Start the heartbeat cron job for liveness verification

2. **Codebase Exploration & Analysis (R1, R2, R3)** [in-progress]
   - Spawn a `teamwork_preview_explorer` to perform a comprehensive codebase audit covering:
     - Performance (R1): Bundle size, next/image vs img, lazy loading, Suspense, heavy client imports, next.config.ts caching.
     - Code Quality (R2): Re-renders, Zustand stores structure, React Query usage, dead code, useEffect issues, TypeScript errors.
     - Security (R3): Token storage (js-cookie), env variables leakage, API Auth headers leak, Zod validations, CSP headers, XSS risks.
   - Wait for explorer report.

3. **Running Automated Tools (R4)** [in-progress]
   - Spawn a `teamwork_preview_worker` to run the required automated commands:
     - `npx tsc --noEmit`
     - `npx next lint`
     - Bundle analysis commands (e.g. build with analyzer if configured, or run `npx @next/bundle-analyzer` or analyze bundle sizes)
   - Save the raw and interpreted output of these tools.

4. **Forensic Integrity Audit** [pending]
   - Spawn `teamwork_preview_auditor` to perform integrity checks on the codebase and the audit artifacts, ensuring no fake outputs or cheating.

5. **Synthesis & Report Compilation** [pending]
   - Synthesize all findings from explorer and worker.
   - Format a comprehensive Arabic report with:
     - Executive Summary (5-10 lines)
     - Priority matrix (Critical / High / Medium / Low)
     - R1 (Performance)
     - R2 (Code Quality)
     - R3 (Security)
     - R4 (Automated tools outputs and explanation)
     - Remediation plan sorted by priority
   - Review and verify the final report against the requirements.

6. **Delivery & Completion** [pending]
   - Report final completion to the Sentinel.
