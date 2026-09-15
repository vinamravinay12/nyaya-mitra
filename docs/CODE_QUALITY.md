# Code quality

## Measured

|                       | Value                                                                              |
| :-------------------- | :--------------------------------------------------------------------------------- |
| Source files          | 67                                                                                 |
| Test files            | 35                                                                                 |
| **Largest code file** | **114 lines** (`score-triage.ts`)                                                  |
| Largest file overall  | 223 lines (a playbook — declarative legal data)                                    |
| Lint                  | `eslint --max-warnings 0`                                                          |
| Type checking         | `tsc -b`, strict, with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |

## File size is enforced, not encouraged

`max-lines: 150` is an **error**, not a warning
([`eslint.config.js`](../eslint.config.js)). Large files are the most reliable way
to degrade a codebase, and a rule nobody enforces is not a rule.

It has already forced two decompositions that improved the design:

- `evaluateCondition` exceeded the complexity ceiling as one ten-case switch, so
  leaf evaluation was split out. The result reads better than the original.
- `App` exceeded the line limit, so it became a shell plus `StageView` plus a
  `useSession` hook — separating layout, stage rendering and effects.

Playbooks are explicitly exempt. They are legal content reviewed as prose, and
splitting one across files would make it harder to review, not easier.

## Type safety

The strict flags are the ones that catch real bugs rather than the ones that are
easy to satisfy:

- `noUncheckedIndexedAccess` — array and record access yields `T | undefined`
- `exactOptionalPropertyTypes` — an optional property cannot be set to `undefined`
- `verbatimModuleSyntax`, `isolatedModules`, `noUnusedLocals`, `noUnusedParameters`
- `typescript-eslint` **strict + stylistic, type-checked**

**`tsc -b`, not `tsc --noEmit`.** Against a solution-style root config with
`"files": []`, `tsc --noEmit` type-checks _nothing_ and passes vacuously. The
project-references build actually checks each package.

Discriminated unions are used where the alternative would be optional fields that
can silently disagree — `LimitationAssessment` is either `unknown` with a reason,
or computed with a deadline and a day count. There is no state where a deadline
exists but the days remaining do not.

## Style

- Prettier, with `.editorconfig`
- Tailwind utilities — **no inline `style={{}}` objects**, which inflate files,
  block reuse and get expanded further by the formatter
- `complexity: 12`, `max-lines-per-function: 60`, `eqeqeq`, `no-console`
- `no-console` has exactly two documented exceptions: the process entry point and
  the server logger

## One gate

```bash
npm run verify
```

`format:check → lint → typecheck → test:coverage → build`. Fails on any one, and
runs identically in CI.

## Known gaps

- **Test-to-source ratio is 35:67**, below the near-1:1 of the strongest
  reference projects. Many source files are small type-only modules with nothing
  to test, but the ratio is worth closing.
- **The condition language cannot express everything a playbook needs.** A rule
  like "the notice window closed **and** no notice was sent" depends on a computed
  deadline rather than a collected fact, so it cannot currently be written. See
  [ADR-004](decisions.md).
- **No mutation testing**, so assertion strength is unproven.
- **ESLint pinned to 9** pending `jsx-a11y` support for 10 — see
  [ADR-010](decisions.md).
