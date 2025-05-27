[ ] Update goal setting visualization to add goals to the metrics
[ ] Add "Finalize Scenario"
[ ] Add some resources to meet goals
[ ] Add pdf export of goals and "changes"
[X] Hide Visuals

[] Add question for how confident are you feeling
[] Add expense ratio assumption for practice profit

# Implementation Cleanup Todos

## 3. Persisted-state validation (Zod)

- [ ] Install `zod` and create `src/lib/persistence-schema.ts` containing a schema for the calculator's local-storage payload.
- [ ] Refactor `CalculatorWidget` to parse persisted data with the schema and fall back to defaults on failure.

## 4. Refactor TherapyCalculator into feature folders

- [ ] Move helper hooks (`calculateRevenue`, `calculateHours`, etc.) to `src/hooks/therapy/`.
- [ ] Split UI into smaller components under `src/components/therapy/` (rows, dialogs, charts).
- [ ] Add unit tests for helpers with Vitest.

## 7. Deployment tweaks (Vercel)

- [ ] Add production-ready `next.config.ts` (edge runtime where possible, image optimisation opts, strict TS/eslint).
- [ ] Create a Vercel env var `NEXT_PUBLIC_VERCEL_ENV` and use it for feature flags.

## 8. Nice-to-have Road-map

- [ ] Unit tests for calculator math edge-cases.
- [ ] Playwright smoke test for both routes.
- [ ] Skeleton / shimmer loader for font & chart mount to improve CLS.
- [ ] Dark-mode toggle.
