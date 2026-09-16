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

### Light and dark

The page follows the reader's system setting, with an explicit Light / System /
Dark control that overrides it. `system` removes the theme attribute rather than
resolving it, leaving the CSS media query in charge — that is what keeps the
first paint correct without an inline script, which the strict CSP forbids.

`color-scheme` is set per theme, so native controls — the date picker in
particular — render correctly rather than staying stubbornly light on a dark page.

Status colours (urgency bands, deadline chips, effort levels) are **semantic
tokens**, not raw palette classes, so every surface that conveys urgency themes
together instead of one component at a time.

**Both themes are verified, not assumed.** Lighthouse only audits the light
theme, so the dark palette's contrast ratios are computed directly from the
tokens — oklch converted to linear sRGB, then WCAG relative luminance. Fifteen
foreground/background pairs are checked in each theme:

| Theme | Lowest ratio |
| :---- | -----------: |
| Light |       5.16:1 |
| Dark  |       5.07:1 |

Both clear the 4.5:1 AA minimum for body text. The check caught one dark pair at
4.32:1 — the fill behind an urgent icon, which would have passed the 3:1 non-text
rule but not the text one; it was lightened rather than argued about.

### Contrast is a token-level guarantee

`--color-muted` is set so that secondary text clears 4.5:1 on **every** surface
in the system — white cards, the page ground, and the warm accent tint alike. An
earlier value passed on white and failed at 4.44:1 on the tint; see
[lighthouse-results.md](lighthouse-results.md).

Typography is self-hosted (Inter, OFL), which keeps `font-src 'self'` in the CSP
and means no third party learns who is reading a page about their legal problem.

## Known gaps

- **No screen-reader testing** with NVDA, JAWS or VoiceOver.
- **English only.** For an India-facing tool this is a real limitation, not a
  nicety — vernacular and voice input would materially widen who can use it.
- **Date input relies on the native picker**, whose accessibility varies by
  browser.
