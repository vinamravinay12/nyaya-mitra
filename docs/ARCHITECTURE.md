# Architecture

## The shape of the problem

A legal assistant has one failure mode that matters more than all the others:
**confidently stating law that does not exist.** A wrong summary wastes someone's
time. A fabricated section number sends them to court with a claim built on
nothing.

Every structural decision here follows from designing that failure out rather
than trying to prompt it away.

## The central idea: the model does not supply the law

```
          ┌──────────────────────────────────────────────┐
          │  Situation Playbooks (data, human-reviewed)  │
          │  statutes · deadlines · forums · costs       │
          └───────────────────┬──────────────────────────┘
                              │  supplies all legal content
                              ▼
 user text ──► Gemini ──► classify + extract ──► engine ──► assessment
                 │                                 ▲
                 │  supplies only: which playbook,  │
                 └─ and which facts the user stated ┘
```

The model performs two narrow jobs: pick a playbook, and pull out facts the user
actually stated. It is never asked what the law says, what the deadline is, or
what the user should do.

The consequence is that the worst a model error can produce is a **wrong
classification** — which the user sees, because the matched situation title is on
screen, and can correct. It cannot produce a wrong statute.

Two guards make this structural rather than aspirational
([`classify-scenario.ts`](../packages/server/src/classify/classify-scenario.ts)):

- **Unknown playbook id → rejected.** The registry is the authority; a
  hallucinated id resolves to nothing and the result becomes `unrecognised`.
- **Undeclared facts → dropped.** `retainDeclaredFacts` keeps only fields the
  chosen playbook asks for or derives. Invented fields never reach the engine.

## Package boundaries

```
packages/
├── core     pure domain logic — no React, no I/O, no network
├── server   Express API; holds the Gemini key
└── client   React + Vite + Tailwind
```

### `core` — pure by construction

Every function is total, synchronous and side-effect free. Nothing imports React,
`fetch`, or the filesystem. Even the current date is a **parameter**, not a
`Date.now()` call.

This is not stylistic. It is what makes 100% coverage both reachable and
meaningful: there is no I/O to mock, so a passing test exercises the real logic.
It also makes assessments reproducible — the same case and the same date always
produce the same answer, which matters when the output is something a person may
act on.

Flow through the engine ([`assess-case.ts`](../packages/core/src/assess/assess-case.ts)):

| Step | Module                          | Responsibility                                         |
| :--- | :------------------------------ | :----------------------------------------------------- |
| 1    | `facts/find-missing-facts`      | Which decisive facts are still outstanding             |
| 2    | `limitation/compute-limitation` | Run each applicable deadline clock                     |
| 3    | `triage/score-triage`           | Red flags, deadlines and amount → a band, with reasons |
| 4    | `routes/select-routes`          | Which forums are open, and why the others are not      |

`assessCase` runs against an **incomplete** case on purpose. A red flag such as an
illegal lockout must surface the moment that fact arrives, not after the
questionnaire finishes. A `ready` flag tells the caller whether the picture is
complete.

### `server` — the trust boundary

The Gemini key lives in this process and nowhere else. The browser talks only to
`/api`. Verified by grepping the built client bundle for the key: zero matches.

Prompt construction and response parsing are **pure modules**, separately tested.
Only the network call itself is an adapter, so almost none of this layer requires
mocking to test.

```
routes/  → thin HTTP handlers, Zod-validated at the boundary
classify/→ orchestration: prompt → model → parse → validate → guard
prompts/ → pure: build the prompt, fence untrusted text, parse the response
security/→ pure: injection detection, response headers
llm/     → the only impure part: the Gemini adapter, with retry
```

### `client` — logic out of components

State lives in a pure reducer
([`session-reducer.ts`](../packages/client/src/state/session-reducer.ts)); effects
live in one hook (`use-session`); components render. Formatting is pure and
separately tested. Components stay small enough to test through their
accessible interface rather than their internals.

## Untrusted input

Everything the user types — and anything they paste from a document they did not
write — is treated as **data, never as instructions**.

1. **Fencing.** User text is wrapped in explicit markers, and any markers already
   present are stripped first, so a document cannot close the fence early and have
   its remainder read as part of our own prompt.
2. **Labelling.** The prompt states that the fenced content is a description of
   events written by a member of the public.
3. **Detection, not blocking.** `detectPromptInjection` flags text that addresses
   the model. It informs the user; it does not refuse. Contracts are full of
   imperatives — _"the Tenant shall not sublet"_ — so a rule that merely looked
   for commands would reject genuine agreements. The patterns are anchored to
   second-person address, and there are tests asserting real contract clauses do
   not trip them.

This matters beyond security: the same confusion between _our instructions_ and
_user data_ caused a real bug during development, where the stub client scanned
the entire prompt — including our own list of out-of-scope keywords — and
classified every scenario as out of scope.

## Deadlines

Limitation periods are the highest-stakes computation here: a miscalculation can
mean a lost remedy.

- **UTC throughout.** Dates are handled as UTC-midnight timestamps so a user in
  IST and a server in UTC agree. A one-day drift is the difference between a live
  claim and a dead one.
- **Strict parsing.** `2026-02-30` is rejected rather than rolled forward.
- **Conditional clocks.** A rule declares `appliesWhen`. Without it, every
  playbook would show every deadline it knows about to every user — including
  remedies their facts rule out, which is alarming and wrong.
- **Expired ≠ dead.** An expired window escalates to _lawyer-recommended_, never
  "you have no claim". Courts can condone delay; the system does not pretend
  otherwise.

## Why conditions are data

Playbook branching uses a small declarative language
([`condition.ts`](../packages/core/src/types/condition.ts)) rather than predicate
functions, so that every branch a playbook can express is one of ten variants
evaluated by a single tested function.

This buys something specific: `collectConditionFacts` can walk a condition tree
and enumerate its dependencies, which lets a test assert that **no playbook
branches on a fact it neither asks for nor derives**. That test caught a real
bug — the rental playbook branched on `stateAdoptedModelTenancyAct`, which it
never collected, so the Rent Authority route could never have activated.

Predicate functions would have made that check impossible.

## Verification

One gate, run in CI and locally:

```
format:check → lint → typecheck → test:coverage → build
```

- `tsc -b`, not `tsc --noEmit` against a solution-style root config — the latter
  passes vacuously and checks nothing.
- `max-lines: 150` as a lint **error**, not a warning. Playbooks are exempt: they
  are declarative legal data reviewed as prose, not code.
- Coverage uses `all: true`, so an untested module cannot vanish from the
  denominator.
