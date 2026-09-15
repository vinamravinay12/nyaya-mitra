# Architecture decision records

Each record states what was decided, why, and **what it cost** — a decision with
no downside listed usually means the downside was not looked for.

---

## ADR-001 — The model classifies; playbooks supply the law

**Decision.** Legal content lives in hand-written Situation Playbooks. Gemini only
picks a playbook and extracts facts the user stated.

**Why.** A fabricated section number is the worst thing this product could do. If
the model never supplies law, it cannot fabricate law. A misclassification is
visible to the user — the matched title is on screen — and correctable.

**Cost.** Coverage grows only as fast as playbooks are written by hand. A
general-purpose legal chatbot would appear to cover far more on day one. We think
appearing to cover everything while being unreliable is worse than covering five
situations dependably.

---

## ADR-002 — Scenario-first, not document-first

**Decision.** The entry point is "describe what happened", not "upload a PDF".

**Why.** People do not experience a legal problem as a document. They experience
it as something that happened to them, and frequently do not know it is a legal
problem at all, or which area it falls in. Document-first tools answer _"what
does this say"_, which the user could largely already read.

**Cost.** We give up the immediate demo appeal of parsing a contract, and we
depend on classification quality from free text.

---

## ADR-003 — `core` is pure, and `today` is a parameter

**Decision.** No React, no I/O, no network in `core`. The current date is passed
in rather than read from the clock.

**Why.** Pure logic can be tested without mocks, so 100% coverage means the real
logic ran. Injecting the date makes assessments reproducible and lets deadline
boundaries be tested directly — testing "what happens on the last day" is
otherwise awkward and flaky.

**Cost.** Every caller must supply a date, including the browser, which needs its
own `todayInIndia` helper to avoid a UTC/IST off-by-one.

---

## ADR-004 — Playbook conditions are data, not functions

**Decision.** Branching uses a ten-variant declarative condition type evaluated by
one function, rather than predicates written per playbook.

**Why.** Data can be inspected. `collectConditionFacts` enumerates a condition's
dependencies, which lets a test assert no playbook branches on a fact it never
collects. That test immediately caught a route that could never activate.

**Cost.** Anything the condition language cannot express requires extending the
language. We have already hit this: "the notice window has closed **and** no
notice was sent" cannot be written, because it depends on a computed deadline
rather than a collected fact.

---

## ADR-005 — The Gemini key never reaches the browser

**Decision.** All model calls go through our Express server.

**Why.** Vite inlines anything in the client bundle. A key shipped to the browser
is a key published.

**Cost.** The app cannot be a static site; it needs a running server.
**Verified:** grep for the key in `packages/client/dist/assets/*.js` → 0 matches.

---

## ADR-006 — Unavailable routes stay visible

**Decision.** A route the user cannot take is shown, marked closed, with the
reason — rather than filtered out.

**Why.** Knowing which door is shut is as useful as knowing which is open. It also
stops people pursuing a forum that will refuse them, which is where a naive
assistant sends someone to the police over a civil debt.

**Cost.** A longer results page, and the reasons must be worded carefully. We got
this wrong once: the Rent Authority route asserted _"your state has not adopted
the Model Tenancy Act"_ when we had never determined that. Stating a fact we had
not established was worse than saying nothing.

---

## ADR-007 — Prompt injection is detected, not blocked

**Decision.** Flag suspicious text and tell the user; never refuse on a match.

**Why.** Legal documents are full of imperatives. _"The Landlord must respond
within 15 days"_ and _"the Guarantor shall act as surety"_ would trip a naive
command detector, so blocking on a match would reject genuine contracts. The real
defence is fencing plus labelling; detection exists so a user can be told their
document contains something odd.

**Cost.** A determined injection is not stopped by detection alone. We rely on the
fence, on the model's narrow job, and on the registry guard that rejects any
playbook id it did not author.

---

## ADR-008 — Transient upstream errors are retried; quota errors are not

**Decision.** Retry 500/502/503/504 with exponential backoff. Never retry 429.

**Why.** Gemini returns 503 "high demand" often enough that a single attempt fails
a noticeable share of requests. But the free tier caps requests **per day**, so a
429 will not clear within any backoff window — retrying it simply spends two more
of the requests the user has left. We shipped this bug and had to fix it.

**Cost.** A per-minute rate limit that would have cleared is now surfaced as an
error. Given the daily cap dominates in practice, that is the right trade.

---

## ADR-009 — An unsupported situation is not an error

**Decision.** Three distinct outcomes: _refused_ (out of scope by design),
_unrecognised_ (we do not cover it yet, here is what we do), and _failed_
(something broke).

**Why.** Collapsing these reads as a crash and implies the user did something
wrong. A refusal is a judgement about the case; an unrecognised situation is a gap
in our product and should say so, and say what we _can_ help with.

**Cost.** More states in the reducer and more shapes in the API response.

---

## ADR-010 — ESLint 9, not 10

**Decision.** Pin ESLint to 9.x.

**Why.** `eslint-plugin-jsx-a11y` declares support only through ESLint 9 and will
not install cleanly against 10. Accessibility is a first-class requirement here,
and a clean dependency tree is worth more than a major version.

**Cost.** We are a major version behind on the linter, and will need to revisit
when the plugin supports 10.

---

## ADR-011 — File size is enforced by the linter

**Decision.** `max-lines: 150` as an **error**. Playbooks exempt.

**Why.** Large files are the thing that most reliably degrades a codebase, and a
rule nobody enforces is not a rule. It has already forced two useful
decompositions: `evaluateCondition` split from its leaf evaluator, and `App` split
into a shell plus `StageView`.

**Cost.** Occasionally a natural unit has to be split. Playbooks needed an
explicit exemption — they are legal data reviewed as prose, and breaking one
across files would make it harder to review, not easier.
