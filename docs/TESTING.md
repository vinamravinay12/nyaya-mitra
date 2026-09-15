# Testing

```bash
npm run test:coverage
```

## Measured

|            | Value              |
| :--------- | :----------------- |
| Tests      | **328**            |
| Test files | 35                 |
| Statements | **100%** (463/463) |
| Branches   | **100%** (292/292) |
| Functions  | **100%** (141/141) |
| Lines      | **100%** (450/450) |

Thresholds are enforced at 100% in [`vitest.config.ts`](../vitest.config.ts); the
build fails on any drop.

## Why 100% is meaningful here rather than decorative

Coverage is easy to inflate. Three things keep this number honest:

**`all: true`.** Every source file is in the denominator, not only files a test
happened to import. Without it, an entirely untested module simply disappears
from the report.

**The domain logic is pure.** `core` has no I/O, no network and no React, so
tests exercise the real code paths rather than mocks. Where a dependency exists —
the Gemini adapter, the clock, the backoff delay — it is **injected**, so the real
code is still what runs.

**Unreachable branches were removed, not tested around.** Where coverage found a
branch that could not execute, the fix was to make the code total rather than to
contrive a test:

- `STATUS_TEXT[...] ?? status` → a `Record` total over every status, no fallback
- `INPUT_TYPES[kind] ?? 'text'` → total over every `FactKind`
- `if (question !== undefined)` in the answer handler → the caller passes the id
- two guards in the assessment effect → one value that is either present or not

## Exclusions

Two files, named in [`vitest.config.ts`](../vitest.config.ts) with reasons:

- `packages/server/src/index.ts` — process entry point; reads the real environment
  and binds a port
- `packages/client/src/main.tsx` — DOM bootstrap

Everything they wire together is tested directly. Test helpers under
`test-utils/` are excluded as test infrastructure rather than product code.

## What the tests actually assert

**Playbook invariants** ([`registry.test.ts`](../packages/core/src/playbooks/registry.test.ts))
run over _every_ playbook, so a new one is validated the moment it is registered:

- no playbook branches on a fact it neither asks for nor derives
- every limitation clock runs from a date fact the playbook collects
- every enum fact declares options, and only enum facts do
- route ids are unique, costs are non-negative, `minDays <= maxDays`
- a route explains unavailability only if it can actually be unavailable
- every citation carries an act, a year, a provision and a note

This caught a real bug on the day it was written: the rental playbook branched on
`stateAdoptedModelTenancyAct`, which it never collected, so the Rent Authority
route could never have activated.

**Deadline boundaries** are tested at the edges — the day a window closes, the day
after, leap days, month rollovers, and a date that does not exist (`2026-02-30`).
During development the tests caught two arithmetic errors in the _test author's_
expectations rather than the code, which is the correct direction.

**Injection detection** is tested for false positives, not only true ones. Real
contract clauses must not trip it.

**HTTP behaviour** is tested through the real Express app with `supertest`:
security headers, malformed bodies, unknown routes, quota vs. unavailability, and
an assertion that an internal error message does not reach the client.

**Accessibility** — 16 axe assertions across the component suite, each asserting
zero violations. Components are queried by role and label, so the tests double as
accessible-interface assertions.

**The full user journey** is covered in [`App.test.tsx`](../packages/client/src/App.test.tsx):
classification, per-question intake, refusal, unsupported situation, service
failure, quota exhaustion, and restart.

## Known gaps

- **No end-to-end browser tests.** Playwright with `@axe-core/playwright` across
  real viewports is the main missing layer. jsdom has no layout engine, so it
  cannot see contrast or touch-target failures.
- **No mutation testing.** 100% line coverage does not prove the assertions are
  strong.
- **The live Gemini path is not exercised in CI.** The adapter is tested against a
  mocked SDK; real classification quality is verified by hand.
