# Contributing

## Getting set up

```bash
npm install
```

The app runs without a Gemini key using a deterministic stub client, so the full
test suite works offline. To use the real model, copy
`packages/server/.env.example` to `packages/server/.env` and add a key from
[aistudio.google.com](https://aistudio.google.com/apikey).

## Before you push

```bash
npm run verify
```

Format check → lint → typecheck → tests with coverage → build. CI runs the same
gate, so a green local run means a green CI run.

## The rules that are enforced

- **Coverage thresholds are 100%.** If a branch cannot be reached, prefer making
  the code total over writing a contrived test — see [docs/TESTING.md](docs/TESTING.md).
- **`max-lines: 150` is an error.** Playbooks are exempt; code is not.
- **No inline `style={{}}`.** Use Tailwind utilities.
- **`jsx-a11y` strict, as errors.** Every interactive component needs an axe
  assertion.

## Adding a Situation Playbook

This is the main way the product grows. A playbook is data, in
`packages/core/src/playbooks`:

1. Write the playbook and register it in `registry.ts`.
2. Run the tests. `registry.test.ts` validates every playbook automatically —
   that conditions only reference facts you collect, that limitation clocks run
   from date facts, that routes are coherent, that citations are complete.
3. Check every provision against the current text. **The IPC was replaced by the
   BNS on 1 July 2024**; older references are out of date.
4. Where the law differs by state, set `stateSpecific: true` and say so in the
   note rather than picking one state's rule.

The standard for a citation is that a lawyer reading it would recognise it as
correct. If you are not sure a provision says what you think it says, leave it
out — an incomplete playbook is recoverable, a wrong one is not.

## Writing questions

Every `decisiveFact` carries a `why`, and the user sees it. Write it as an
explanation of what turns on the answer, not as a justification for asking.

Ask only facts that change the outcome. A question that does not change the
answer is a question that makes someone abandon the form.
