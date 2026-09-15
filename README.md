# Nyaya Mitra

**Scenario-first legal triage for everyday legal problems in India.**

You describe what happened in your own words. Nyaya Mitra works out which kind of
problem it is, asks only the questions that change the answer, and tells you your
options, your deadlines, and — plainly — whether you actually need a lawyer.

**Live: https://nyaya-mitra-eb9a3.web.app**

> Nyaya Mitra explains general legal information about Indian law. It is not a
> lawyer and does not give legal advice.

---

## The vertical

**Legal information access.** Specifically, the gap between _understanding_ a
legal situation and being able to _act_ on it.

The person who drafted the rental agreement, the offer letter or the terms of
service had a lawyer. The person signing it did not. That asymmetry is the whole
problem, and it produces four questions that a document summariser cannot answer:

- Am I being treated unfairly, or is this normal?
- What can I actually do about it?
- How long do I have?
- Is this worth paying a lawyer for?

Most legal-AI tools are document-first: upload a PDF, get a summary, chat with it.
That answers _"what does this say"_, which the user could mostly already read.
Nyaya Mitra is **scenario-first** — it starts from _"here is what happened to me"_,
which is how people actually experience a legal problem.

## Approach and logic

### Situation Playbooks

The core design decision: **the model never supplies the law.**

Each kind of everyday legal problem is described once, as data, in a _Situation
Playbook_ ([`packages/core/src/playbooks`](packages/core/src/playbooks)). A playbook declares:

| Field           | What it holds                                                                         |
| :-------------- | :------------------------------------------------------------------------------------ |
| `decisiveFacts` | The few facts that actually change the answer, each with the reason it is being asked |
| `governingLaw`  | Real statutory provisions, with a plain-language note                                 |
| `limitations`   | Deadline clocks, and the conditions under which each applies                          |
| `redFlags`      | Fact patterns that override normal triage and escalate immediately                    |
| `routes`        | Real forums, with real costs, timelines and effort                                    |

The language model's job is deliberately narrow: **classify the scenario into a
playbook, and extract facts the user stated.** It is never asked what the law
says or what the user should do.

This means a model error can produce a wrong _classification_ — which is visible
and correctable, because the user sees the matched title — but it can never
produce a fabricated statute. Two guards enforce it:

- a playbook id the registry does not contain is rejected outright
- extracted facts the playbook never declared are dropped

### Triage, not advice

Escalation is monotonic across three signals — red flags, deadlines, and amount
at stake — and the most serious always wins:

| Band                  | Meaning                                            |
| :-------------------- | :------------------------------------------------- |
| 🟢 self-serve         | Nothing here needs a lawyer yet                    |
| 🟡 guided             | Do it yourself, but get the paperwork right        |
| 🟠 lawyer-recommended | Worth paying for, and here is the kind to look for |
| 🔴 urgent             | A deadline is closing or a right is at risk        |

Every band comes back with **the reasons that produced it**. A bare verdict is
not something a person can act on or disagree with.

### Knowing what it does not know

Criminal defence, family and custody matters, immigration, and anything already
before a court are **explicitly out of scope** and routed to a professional.
Refusing these is a feature of the design, not a gap in it.

## How the solution works

```
Scenario (free text)
   │
   ├─► classify ──────► situation playbook + facts the user stated
   │                    (Gemini; rejects unknown ids, drops invented facts)
   │
   ├─► fact gap ──────► ask ONLY the decisive facts still missing, one at a time
   │
   ├─► deadlines ─────► limitation clocks computed in UTC from the user's dates
   │
   ├─► triage ────────► 🟢 🟡 🟠 🔴, with reasons
   │
   └─► routes ────────► real forums and costs, including the ones NOT open, and why
```

Three packages:

- **`core`** — the whole engine as pure functions. No React, no I/O, no network.
  This is what makes 100% test coverage both achievable and meaningful.
- **`server`** — Express API holding the Gemini key. The browser never sees it.
- **`client`** — React + Vite + Tailwind.

### Situations covered today

| Domain         | Situation                                         |
| :------------- | :------------------------------------------------ |
| Rental         | Landlord is withholding a security deposit        |
| Employment     | Employer has not paid salary or dues              |
| Consumer       | A purchase is faulty and a refund is refused      |
| Cyber fraud    | Money taken from an account without authorisation |
| Money recovery | A cheque has bounced                              |

## Running it

```bash
npm install
```

Add your key (get one at [aistudio.google.com](https://aistudio.google.com/apikey)):

```bash
cp packages/server/.env.example packages/server/.env
```

Start the API, then the client, in two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The app runs **without** a key too, using a deterministic stub client — useful
for development and for running the full test suite offline.

### Verification

```bash
npm run verify
```

Format check → lint → typecheck → tests with coverage → build. Fails on any one.

## Measured evidence

|                      | Measured                                                                                                        |
| :------------------- | :-------------------------------------------------------------------------------------------------------------- |
| Tests                | **328** across 35 test files                                                                                    |
| Coverage             | **100%** statements, branches, functions and lines (463/463, 292/292, 141/141, 450/450)                         |
| Largest code file    | **114 lines** (`score-triage.ts`)                                                                               |
| Largest file overall | 223 lines (a playbook — declarative legal data, not logic)                                                      |
| Client bundle        | 233 KB raw / ~73 KB gzipped                                                                                     |
| Lint                 | `eslint --max-warnings 0`, `typescript-eslint` strict + stylistic type-checked, `jsx-a11y` **strict as errors** |
| Accessibility        | Zero axe violations asserted on every interactive component                                                     |

Coverage counts every source file (`all: true`), so an untested module cannot
quietly vanish from the denominator. Two files are excluded and named in
[`vitest.config.ts`](vitest.config.ts): the server's process entry point and the
client's DOM bootstrap, both of which bind to the outside world.

## Assumptions

1. **Indian law only.** Provisions, forums, filing fees and limitation periods
   are India-specific and are not portable to another jurisdiction.
2. **Rent law is state law.** Where an answer turns on the state, the system says
   so rather than guessing.
3. **The user's dates are accurate.** Deadline calculations are only as good as
   the dates supplied, and the system says which date each clock runs from.
4. **Calendar days, conservatively.** Where a rule counts _working_ days — such
   as the RBI three-day reporting window — calendar days are used instead. This
   can only ever understate the time available, never overstate it.
5. **Limitation periods are the general rule.** Courts can condone delay in some
   circumstances. The system flags an expired window and sends the user to a
   lawyer rather than declaring the claim dead.
6. **Classification can be wrong.** The matched situation is shown to the user so
   a mismatch is visible and correctable.

## Known gaps

Stated plainly, because a legal tool that oversells itself is worse than one that
does less.

- **`stateAdoptedModelTenancyAct` is declared but never derived.** The Rent
  Authority route is therefore always shown as closed. The wording says we could
  not confirm adoption rather than asserting the state has not adopted it, but
  the derivation itself is not built and needs a verified list of states.
- **No document upload yet.** The engine is built to read a document as evidence
  for a specific dispute, and the playbook artifacts are declared, but ingestion
  is not implemented.
- **Generated artifacts are not implemented.** Playbooks declare the demand
  notice, evidence checklist, lawyer brief and timeline they should produce;
  producing them is not built.
- **The refusal screen does not signpost support services.** Someone disclosing a
  threat is correctly routed away as out of scope, but is not yet pointed toward
  legal aid or a helpline.
- **Five situations, not five domains.** Each domain currently has one playbook,
  covering its most common case rather than the whole area.

## Licence

MIT — see [LICENSE](LICENSE).
