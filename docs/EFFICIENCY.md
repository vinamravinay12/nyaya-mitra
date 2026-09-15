# Efficiency

## Measured

| Asset       |    Raw |   Gzipped |
| :---------- | -----: | --------: |
| `index.js`  | 227 KB | **70 KB** |
| `index.css` |  10 KB |  **3 KB** |

Reproduce with `npm run build -w @nyaya-mitra/client`.

Most of the JavaScript is React itself. The application code and the five
playbooks are a small fraction of it.

## Where the work happens

The expensive operation is the Gemini call. Everything else is cheap, and the
design keeps it that way:

**One model call per case.** Classification and fact extraction happen in a single
request. The follow-up questions, the deadline calculations, the triage and the
routes all run locally in pure functions — no model involvement at all.

**`/api/assess` uses no model.** Re-running an assessment as the user answers each
question costs nothing upstream and is deterministic.

**A light model for a narrow job.** The model only classifies and extracts, so it
runs on `gemini-3.1-flash-lite` rather than a reasoning-grade model. Temperature
is 0.2 and the response is constrained to JSON.

**Retry that does not waste quota.** Transient 503s are retried with exponential
backoff; 429 quota rejections are **not**, because a per-day cap will not clear
within a backoff window and retrying spends requests the user still needs. This
was a bug we shipped and fixed — see [ADR-008](decisions.md).

## Measured in a real browser

Lighthouse scores **100 for performance on both desktop and mobile**, with 0 ms
total blocking time and 0 cumulative layout shift. Full numbers in
[lighthouse-results.md](lighthouse-results.md).

## Test suite

328 tests run in roughly 3 seconds, split into a Node project and a jsdom
project so the pure domain tests are not paying for a DOM they do not use.

## Known gaps

- **No route-level code splitting.** The app is a single flow, so there is nothing
  meaningful to split yet. This would matter as soon as a second route exists.
- **No caching of classifications.** An identical scenario submitted twice costs
  two model calls.
- **jsdom is created per test file** (17 times). Vitest suggests `isolate: false`
  to share it; kept isolated for now because per-file isolation is worth more than
  the seconds saved.
