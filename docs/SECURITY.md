# Security

Measured evidence, and what is still open. Run `npm run verify` to reproduce the
local checks; the CI workflows in [`.github/workflows`](../.github/workflows) run
the rest.

## Credentials

The Gemini API key lives in the server process and is never sent to the browser.
Vite inlines anything the client bundle can see, so this is **asserted, not
assumed** — `bundle-has-no-secrets` in [`verify.yml`](../.github/workflows/verify.yml)
greps the built client for API-key-shaped strings and fails the build on a match.

| Check                                           | Result                                                    |
| :---------------------------------------------- | :-------------------------------------------------------- |
| API-key-shaped string in `packages/client/dist` | 0 matches                                                 |
| `GEMINI_API_KEY` referenced in the bundle       | 0 matches                                                 |
| `.env` tracked by git                           | No — ignored, and `.env.example` holds blank placeholders |
| Secrets in git history                          | `gitleaks` runs on full history in CI                     |

The server **refuses to start in production without a key**
([`config.ts`](../packages/server/src/config.ts)). Silently degrading a deployed
legal assistant to canned stub answers would be worse than failing to boot.

## Untrusted input

Everything the user types is treated as data. See
[ARCHITECTURE.md](ARCHITECTURE.md#untrusted-input) for the reasoning.

- **Fencing.** User text is wrapped in explicit markers; markers already present
  in the input are stripped first, so a pasted document cannot close the fence
  early and have its remainder read as our instructions.
- **Detection.** `detectPromptInjection` flags text addressing the model, anchored
  to second-person phrasing. Tests assert that genuine contract clauses —
  _"the Landlord must respond within 15 days"_, _"the Guarantor shall act as
  surety"_ — do **not** trip it.
- **Registry guard.** A playbook id the model invents is rejected; facts the
  playbook never declared are dropped before reaching the engine.

## Request handling

- **Zod validation at every boundary** — request bodies and the model's own
  response are parsed against a schema and rejected, never coerced.
- **Body limit** of 256 KB.
- **No internal detail in responses.** Errors return a fixed message; the cause is
  logged server-side only. A test asserts a thrown `DB_PASSWORD=hunter2` does not
  appear in the response body.
- **Quota exhaustion is distinguished from failure** (429 vs 503), so the user is
  told the truth rather than invited to retry something that cannot succeed.

## Response headers

Set on every API response ([`security-headers.ts`](../packages/server/src/security/security-headers.ts)):

```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Cross-Origin-Resource-Policy: same-site
Cross-Origin-Opener-Policy: same-origin
X-Permitted-Cross-Domain-Policies: none
Origin-Agent-Cluster: ?1
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

`x-powered-by` is disabled. The API returns JSON only, so the policy is fully
closed — no scripts, frames or embedding.

## Supply chain

| Control                             | Where                                           |
| :---------------------------------- | :---------------------------------------------- |
| CodeQL, `security-extended` queries | [`codeql.yml`](../.github/workflows/codeql.yml) |
| `npm audit --audit-level=high`      | `audit` job in `verify.yml`                     |
| gitleaks over full history          | `secrets` job in `verify.yml`                   |
| Dependabot, weekly                  | [`dependabot.yml`](../.github/dependabot.yml)   |

`npm audit` currently reports **0 vulnerabilities**.

## Privacy

Case facts are held in browser memory for the duration of a session. There is no
database, no account, and nothing is persisted server-side. Scenario text is sent
to Gemini for classification — this is stated in the UI.

## Rate limiting

`/api/classify` and `/api/assess` are limited to 20 requests per minute per
client, returning 429 with `Retry-After`. Health checks are not limited.

Requests arrive through Firebase Hosting, so `request.ip` resolves to a Google
edge address that **differs per request** — which gave every request its own
bucket and defeated the limit entirely. It went unnoticed until the limiter was
tested through the real entry point rather than directly against Cloud Run. The
key is now the leftmost `X-Forwarded-For` entry, which is the original client
however many proxies sit in between.

That entry is client-settable. This limiter exists to stop one ordinary client
exhausting the shared upstream model quota, not to withstand a deliberate
attack; a shared store keyed on something stronger is the next step if that
changes.

## Response shaping

The engine's structures carry the conditions that drive routes, red flags and
limitation clocks. None of it is rendered and all of it is internal reasoning, so
responses now pass through an explicit view layer
([`public-assessment.ts`](../packages/server/src/views/public-assessment.ts)) that
sends only the fields the UI reads. A test asserts no `appliesWhen` or
`availableWhen` condition appears in any response.

## Known gaps

- **No authentication.** Deliberate for an anonymous triage tool, but it means the
  API is open to anyone who can reach it.
- **CSP covers the API only.** The client is served separately and needs its own
  policy at the hosting layer; not yet configured.
- **Injection detection is heuristic.** It informs the user; it is not a barrier.
  The structural defences are fencing, the model's narrow job, and the registry
  guard.
