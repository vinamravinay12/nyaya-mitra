# Accessibility

A tool for people navigating a legal problem alone is used disproportionately by
people who are under stress, on a phone, or not reading in their first language.
Accessibility here is a functional requirement, not a compliance exercise.

## Enforced, not aspirational

`eslint-plugin-jsx-a11y` runs in **strict** mode as **errors** over every
component ([`eslint.config.js`](../eslint.config.js)). A warning is a rule nobody
fixes; the build fails instead.

**16 axe assertions** across the component suite, each asserting zero violations,
on every interactive component and on both the opening and results screens of the
full app.

## What is in place

|                   | How                                                              |
| :---------------- | :--------------------------------------------------------------- |
| Skip link         | First focusable element, targets `#main`                         |
| Landmarks         | `<main id="main">`, section headings throughout                  |
| Labels            | Every input has an associated `<label htmlFor>`                  |
| Descriptions      | Every input is `aria-describedby` the reason it is being asked   |
| Grouped questions | Yes/no uses `<fieldset>` + `<legend>`, announced as one question |
| Status            | `aria-live="polite"` announces work in progress                  |
| Errors            | Refusals and failures use `role="alert"`                         |
| Motion            | `prefers-reduced-motion` respected                               |
| Colour            | Never the sole carrier of meaning                                |

### Colour is never the only signal

Each triage band pairs a colour with an **icon and a sentence**:

| Band               | Mark | Text                                |
| :----------------- | :--- | :---------------------------------- |
| self-serve         | ✓    | You can handle this yourself        |
| guided             | !    | You can do this yourself, with care |
| lawyer-recommended | ⚑    | A lawyer is worth it here           |
| urgent             | ⚠    | Act now                             |

A reader who cannot distinguish the colours gets the full verdict from the text.

### Semantics fixed rather than worked around

The question card originally nested a `<label>` inside a heading that also served
as the section's `aria-labelledby`. Two elements resolved to the same accessible
name, so a screen-reader user would hear the question twice and a by-label query
matched both. The fix was to restructure the markup — a fieldset for grouped
answers, a plain label for value inputs — rather than to adjust the test.

## Responsive

Mobile-first, verified at 375×812 and at desktop width. No horizontal scrolling;
content reflows rather than shrinking.

## Verified in a real browser

Lighthouse scores **100 for accessibility on both desktop and mobile** against the
deployed site — see [lighthouse-results.md](lighthouse-results.md). This matters
because jsdom has no layout engine: the axe assertions in the test suite
structurally cannot see touch-target size (WCAG 2.5.8) or computed colour
contrast, and only a real browser can.

## Known gaps

- **No screen-reader testing** with NVDA, JAWS or VoiceOver.
- **English only.** For an India-facing tool this is a real limitation, not a
  nicety — vernacular and voice input would materially widen who can use it.
- **Date input relies on the native picker**, whose accessibility varies by
  browser.
