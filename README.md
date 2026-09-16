# ⚖️ Nyaya Mitra – Everyday Legal Triage for India

Nyaya Mitra is a GenAI-powered legal triage assistant for everyday legal problems in India. You describe what happened in plain words, optionally attach the document, and it tells you your options with real costs and forums, the deadlines that apply to you, and — plainly — whether you actually need a lawyer.

**Live Demo**:

- ⚖️ **App**: [https://nyaya-mitra-eb9a3.web.app](https://nyaya-mitra-eb9a3.web.app)
- 🔌 **API health**: [/api/health](https://nyaya-mitra-eb9a3.web.app/api/health) — returns `{"status":"ok","mode":"gemini"}` when the live model is wired in

> Nyaya Mitra provides general legal **information**, not legal advice. It is not a lawyer, and it says so on every screen.

---

## 🎯 Chosen Vertical & The Problem

- **Vertical**: Legal information access — the gap between _understanding_ a legal situation and being able to _act_ on it.

- **The Problem (reasoning behind the project)**:
  The party who drafted the rental agreement, the offer letter or the terms of service had a lawyer. The party signing it did not. That asymmetry produces four questions a document summariser cannot answer:
  1. **Am I being treated unfairly**, or is this normal?
  2. **What can I actually do** about it, and what will it cost?
  3. **How long do I have** before a remedy expires?
  4. **Is this worth paying a lawyer for?**

  Most legal-AI tools are document-first: upload a PDF, get a summary, chat with it. That answers _"what does this say"_ — which the user could mostly already read. **Nyaya Mitra is scenario-first.** It starts from _"here is what happened to me"_, which is how people actually experience a legal problem, and frequently they do not know it is a legal problem at all.

- **Persona**: An ordinary person in India facing a dispute alone, with no lawyer and no idea which forum, which deadline, or which law applies to them.

---

## 🧭 How It Works

```
Scenario (plain words, optionally with a document)
   │
   ├─► classify ──────► situation playbook + facts the user stated
   │
   ├─► fact gap ──────► ask ONLY the decisive facts still missing, one at a time
   │
   ├─► deadlines ─────► limitation clocks computed from the user's own dates
   │
   ├─► triage ────────► 🟢 🟡 🟠 🔴, always with the reasons behind it
   │
   └─► routes ────────► real forums and costs, including the ones closed, and why
```

1. **Describe it.** No legal terms needed. Clickable examples are drawn from the playbooks themselves, so what the page advertises can never drift from what the engine handles.
2. **Answer a few questions.** Usually three or four, each shown with the reason it is being asked. Any answer can be changed or gone back to.
3. **See where you stand.** A triage band with its reasons, the deadlines that apply, the options open to you with real costs, and the provisions the answer rests on.

---

## 📂 Situations Covered

**14 situations across six domains.**

| Domain                     | Situations                                                                                                                                   |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏠 **Renting a home**      | Deposit withheld · Eviction, lockout or supplies cut off · Repairs not done                                                                  |
| 🏢 **Society & builders**  | Society or RWA acting unfairly · Builder delaying possession (RERA)                                                                          |
| 💼 **Work & employers**    | Unpaid salary · Unfair dismissal · Long notice period · Non-compete or separation clause · Relieving letter withheld · PF deducted, not paid |
| 🛍️ **Shopping & services** | A purchase is faulty and a refund is refused                                                                                                 |
| 🛡️ **Fraud & scams**       | Unauthorised transaction on a bank account                                                                                                   |
| 💰 **Money owed to you**   | A cheque has bounced                                                                                                                         |

**Deliberately out of scope**, and routed to a professional: criminal defence, family and custody matters, immigration, and anything already before a court. Refusing these is a feature of the design, not a gap in it.

---

## 📄 Reading Your Document

Attach an agreement, offer letter, notice or bill — **PDF, image or text, up to 2 MB**. Optional, never required.

- **Large photos are shrunk in the browser** before upload — a 4 MB phone photo of an agreement typically lands under 500 KB, with the text still comfortably legible.
- **The file must be what it claims to be.** `File.type` comes from the extension and is forgeable, so the bytes are checked against their own signature server-side.
- **Photographs work.** Gemini reads the file directly, so a photo of stamp paper works as well as a typed PDF — which matters, because that is what most Indian rental agreements actually look like.
- **Read as evidence, not summarised.** It fills in facts the document establishes (dates, amounts, the state) and surfaces the clauses that bear on _your_ dispute, each with a line on why it matters.
- **Never stored.** Held in memory for one request.
- **Injection-aware.** If the document contains text addressed to an AI assistant, that text is ignored **and you are shown what it said**. A document written by the other side is evidence, not instructions.

---

## 🤖 How AI is Used (Gemini Integration)

The platform uses **Gemini** via the official `@google/genai` SDK, with `gemini-3.1-flash-lite` as primary and `gemini-flash-lite-latest` as an automatic fallback.

1. **The model never supplies the law.** Legal content lives in hand-written **Situation Playbooks** — statutes, limitation periods, forums, costs — which are reviewed as data. Gemini does two narrow jobs: pick a playbook, and extract facts the user actually stated.
2. **Scenario classification.** Free text is matched to one of 14 situations. The prompt tells it to match _what the person is asking about_, not the biggest event they mention — _"I was laid off and made to sign X, can they do that?"_ is a question about X, not the layoff.
3. **Multimodal document reading.** An attached file is sent as `inlineData` alongside the prompt. Gemini extracts facts from it and returns the clauses relevant to the dispute.
4. **Two guards against hallucination.** A playbook id the registry does not contain is **rejected**. An extracted value that does not fit its declared fact type — an enum answer outside the declared options, a date that is not a real calendar date — is **dropped**, so the user is asked properly instead.
5. **One call per case.** Every follow-up question, deadline, triage band and route is computed locally by pure functions. `/api/assess` involves no model at all and is fully deterministic.

**The consequence:** a model error can produce a wrong _classification_ — which the user sees, because the matched situation is on screen, and can correct with one click — but it can never produce a fabricated statute.

---

## ⚙️ Core Architecture & Tech Stack

| Layer       | Stack                                                                     |
| :---------- | :------------------------------------------------------------------------ |
| **Client**  | React 19 · Vite · Tailwind 4 · self-hosted Inter · light & dark themes    |
| **Server**  | Node 22 · Express 5 · Zod validation · gzip                               |
| **Core**    | Pure TypeScript domain engine — no React, no I/O, no network              |
| **AI**      | Gemini via `@google/genai`, server-side only                              |
| **Hosting** | Firebase Hosting (client) · Cloud Run, `asia-south1`, scale-to-zero (API) |
| **Secrets** | Google Secret Manager                                                     |
| **CI**      | GitHub Actions — verify gate, `npm audit`, gitleaks, CodeQL, Dependabot   |

```
packages/
├── core     pure domain logic — playbooks, deadlines, triage, routes
├── server   Express API; holds the Gemini key
└── client   React + Vite + Tailwind
```

`core` is pure by construction: every function is total, synchronous and side-effect free, and even the current date is a **parameter** rather than a `Date.now()` call. That is what makes 100% coverage both reachable and meaningful — there is no I/O to mock, so a passing test exercises the real logic — and it makes every assessment reproducible.

---

## 🚀 How to Run Locally

### 1. Prerequisites

- Node 20+
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey) — **optional**; without one the app runs on a deterministic stub, so the full test suite works offline.

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Your Key

```bash
cp packages/server/.env.example packages/server/.env
```

### 4. Start the API and the Client

```bash
npm run dev:server
```

```bash
npm run dev:client
```

### 5. Build for Production

```bash
npm run build
```

---

## 📚 Documentation

Detailed engineering documentation lives in dedicated files, each with measured evidence:

| Doc                                                      | Covers                                                                         |
| :------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [docs/SECURITY.md](docs/SECURITY.md)                     | Credential handling, untrusted input, rate limiting, response shaping, headers |
| [docs/TESTING.md](docs/TESTING.md)                       | Strategy, why 100% is meaningful here, playbook invariants, known gaps         |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)           | Enforcement, themes, contrast as a token guarantee, what jsdom cannot see      |
| [docs/EFFICIENCY.md](docs/EFFICIENCY.md)                 | Payload measurements, rendering, where the work actually happens               |
| [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)             | File-size enforcement, type safety, the single quality gate                    |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)             | Why the model does not supply the law, package boundaries, the trust boundary  |
| [docs/decisions.md](docs/decisions.md)                   | 11 Architecture Decision Records — what was chosen, why, and **what it cost**  |
| [docs/lighthouse-results.md](docs/lighthouse-results.md) | Measured Lighthouse audit of the live deployment, and what auditing caught     |
| [CONTRIBUTING.md](CONTRIBUTING.md)                       | Setup, conventions, and how to add a Situation Playbook safely                 |
| [CHANGELOG.md](CHANGELOG.md)                             | Notable changes                                                                |

Run the full quality gate with a single command:

```bash
npm run verify   # format → lint → typecheck → test:coverage → build
```

**Measured Lighthouse** (live deployment): Performance **99** · Accessibility **100** · Best Practices **100** · SEO **100** — on **both** mobile and desktop. 0 ms Total Blocking Time, **0** Cumulative Layout Shift.

---

## 🔒 Security

Full details in **[docs/SECURITY.md](docs/SECURITY.md)**. Highlights:

- **The Gemini API key is never shipped to the browser.** It lives in **Google Secret Manager**, is injected into Cloud Run at runtime, and is used only server-side. CI greps the built client for API-key-shaped strings and **fails the build** on a match — currently **0 occurrences**.
- **The model cannot invent law.** A playbook id outside the registry is rejected; an extracted value that does not fit its declared fact type is dropped. Legal content comes only from reviewed playbooks.
- **Prompt-injection defence, including inside uploaded documents.** Untrusted text is fenced with markers that are stripped from the input first, so a document cannot close the fence early. Detection is anchored to second-person address, with tests asserting that genuine contract clauses — _"the Landlord must respond within 15 days"_ — do **not** trip it.
- **Rate limited** at 20 requests/minute per client on the model-backed endpoints, keyed on the original caller rather than the proxy hop.
- **Responses carry no engine internals.** A view layer sends only the fields the UI reads; route preconditions and red-flag conditions never cross the wire.
- **Strict CSP with no `unsafe-inline`**, plus HSTS, `nosniff`, `X-Frame-Options: DENY`, COOP, `no-referrer` and a closed `Permissions-Policy`.
- **CodeQL (`security-extended`) + gitleaks over full history + Dependabot + `npm audit`** in CI — currently **0 vulnerabilities**.
- **No accounts, no database, nothing persisted.** Case facts live in browser memory for the session; an uploaded document is held for one request.

---

## ♿ Accessibility

Full details in **[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)**. Highlights:

- **Lighthouse accessibility 100** on desktop **and** mobile, against the deployed site.
- **Enforced automatically:** `eslint-plugin-jsx-a11y` runs in **strict** mode as build **errors**, and **16 axe assertions** across the component suite assert zero violations.
- **Meaning is never carried by colour alone.** Every urgency band pairs its colour with an icon _and_ a sentence, so a reader who cannot distinguish them gets the full verdict from the text.
- **Contrast is a token-level guarantee.** Lowest ratio **5.16:1** in light and **5.07:1** in dark, against a 4.5:1 minimum. The dark palette is verified by computing ratios directly from the design tokens, because Lighthouse only audits the light theme.
- **Light, dark and system themes.** `system` leaves the CSS media query in charge so the first paint is already correct without an inline script — which the strict CSP forbids. `color-scheme` is set per theme so the native date picker renders correctly.
- **Fully keyboard operable** with a skip link, a `<main>` landmark, `<fieldset>`/`<legend>` for grouped questions, `aria-describedby` on every input, `role="alert"` for refusals and `aria-live` for progress.
- **`prefers-reduced-motion`** disables non-essential animation and hover movement.

---

## ⚡ Efficiency

Full details in **[docs/EFFICIENCY.md](docs/EFFICIENCY.md)**. Highlights:

- **Lighthouse performance 99** mobile / **100** desktop, with **0** cumulative layout shift and 0 ms total blocking time.
- **One model call answers a whole case.** Classification and fact extraction happen in a single request; every follow-up question, deadline, triage band and route is computed locally. `/api/assess` involves no model at all.
- **Payloads cut by 82%.** The assessment response went from 12,022 bytes to **2,165** — gzip was enabled, and a view layer stopped internal engine data being sent to a page that never displays it. The catalogue went 5,105 → **1,962** bytes.
- **Code-split and memoised.** The results view loads on demand (a 6 KB chunk); the landing page no longer re-renders while the user types.
- **Retry that does not waste quota.** Transient 503s are retried with exponential backoff; 429 quota rejections are **not**, because a per-day cap will not clear within a backoff window. On repeated failure the client moves to the next model rather than giving up.
- **Client bundle**: 244 KB raw / **75 KB gzipped**, most of which is React itself.
- **Caching of classifications was considered and rejected** — it would mean holding users' descriptions of their legal problems server-side, which is not a trade worth making to save one request.

---

## 🛠️ Verification & Testing

Full details in **[docs/TESTING.md](docs/TESTING.md)**. Highlights:

- **695 tests across 50 test files**, at **100% coverage** — 778/778 statements, 453/453 branches, 254/254 functions, 756/756 lines. Thresholds are enforced; the build fails on any drop.
- **Coverage counts every source file** (`all: true`), so an untested module cannot quietly vanish from the denominator. Two files are excluded and named with reasons in `vitest.config.ts`.
- **Unreachable branches were removed, not tested around.** Where coverage found a branch that could not execute, the fix was to make the code total — a `Record` total over every variant, a narrowed type, a value that is either present or absent.
- **Playbook invariants run over every playbook**, so a new one is validated the moment it is registered: no branching on a fact it never collects, every limitation clock running from a date fact, complete citations, units on every quantity. This caught a route that could never have activated, and a duration rendered as a rupee amount.
- **Injection detection is tested for false positives**, not only true ones — real contract clauses must not trip it.
- **HTTP behaviour is tested through the real Express app** with `supertest`: headers, malformed bodies, oversized uploads, quota vs. unavailability, and an assertion that an internal error message never reaches the client.
- **CI** runs the full gate on every push and PR, plus `npm audit`, gitleaks, a client-bundle secret scan, and weekly CodeQL.
- **Known gap:** no Playwright E2E suite. jsdom has no layout engine, so browser-level checks are covered by Lighthouse against the deployment rather than in CI.

---

## 📌 Assumptions

- **Indian law only.** Provisions, forums, filing fees and limitation periods are India-specific and are not portable to another jurisdiction.
- **Rent and shops law is state law.** Where an answer turns on the state, the system says so rather than guessing.
- **The user's dates are accurate.** Deadline calculations are only as good as the dates supplied, and the system names the date each clock runs from.
- **Calendar days, conservatively.** Where a rule counts _working_ days — such as the RBI three-day reporting window — calendar days are used instead. This can only ever understate the time available, never overstate it.
- **Limitation periods are the general rule.** Courts can condone delay. An expired window escalates to a lawyer rather than declaring the claim dead.
- **Classification can be wrong.** The matched situation is shown to the user, with a "Not your situation?" control, so a mismatch is visible and correctable.
- **Gemini is optional in development.** Without a key the app runs on a deterministic stub, so the full suite works offline. In **production it refuses to start without a key** — silently degrading a deployed legal assistant to canned answers would be worse than failing to boot.
- **Free-tier quota.** The live deployment runs on Gemini's free tier, which is capped per model per day. The client falls back to a second model when the first is exhausted.

---

## ⚠️ Known Gaps

Stated plainly, because a legal tool that oversells itself is worse than one that does less.

- **Generated artifacts are not implemented.** Playbooks declare the demand notice, evidence checklist, lawyer brief and timeline they should produce. Producing them is the clearest next piece of work.
- **`stateAdoptedModelTenancyAct` is declared but never derived**, so the Rent Authority route always shows as closed. The wording says adoption could not be confirmed rather than asserting the state has not adopted the Act, but the derivation needs a verified list of states.
- **Workplace harassment is deliberately absent.** The POSH Act route through an Internal Committee is exactly the kind of under-known remedy this product exists to surface, but mis-triaging it causes real harm and the refusal screen does not yet signpost support services. It should be added with that signposting in place, not before.
- **Comparing two documents is not supported.** One document is read against one situation.
- **Fourteen situations, not complete coverage.** Housing and employment go deep; consumer, fraud and money recovery have one playbook each.
- **English only.** For an India-facing tool this is a real limitation rather than a nicety.

---

## 📄 Licence

MIT — see [LICENSE](LICENSE).
