# Efficiency

## Measured

| Asset       |    Raw |   Gzipped |
| :---------- | -----: | --------: |
| `index.js`  | 227 KB | **70 KB** |
| `index.css` |  10 KB |  **3 KB** |

Reproduce with `npm run build -w @nyaya-mitra/client`.

Most of the JavaScript is React itself. The application code and the five
playbooks are a small fraction of it.

## Payload

| Endpoint         |   Before |         Now | Change |
| :--------------- | -------: | ----------: | -----: |
| `/api/assess`    | 12,022 B | **2,165 B** |   −82% |
| `/api/playbooks` |  5,105 B | **1,962 B** |   −62% |

Two changes, measured against the deployed service:

**gzip was not enabled at all.** The API was serving several kilobytes of JSON
uncompressed despite the browser asking for gzip.

**Responses carried the whole playbook**, including red-flag conditions, route
preconditions and limitation internals that the UI never renders. A view layer
now sends only what is read, which cuts the payload and stops the engine's
reasoning being handed out. See [SECURITY.md](SECURITY.md#response-shaping).

## Rendering

The results view is code-split and loaded on demand: it is needed several
seconds and one round trip after first paint, so it is not in the initial
download.

The landing page sections are memoised. The scenario text lives in session
state, so without that every keystroke in the textarea re-rendered all fourteen
example cards.

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

- **No caching of classifications.** An identical scenario submitted twice costs
  two model calls. Caching was considered and rejected: it would mean holding
  users' descriptions of their legal problems server-side, which is not a trade
  worth making to save one request.
- **React is most of the bundle.** Application code and all fourteen playbooks
  are a small fraction of the 76 KB gzipped total.
- **jsdom is created per test file** (17 times). Vitest suggests `isolate: false`
  to share it; kept isolated for now because per-file isolation is worth more than
  the seconds saved.
