# Lighthouse results

Run against the **deployed** site, not a local build — jsdom has no layout engine,
so unit-level axe assertions structurally cannot see computed contrast or
touch-target size.

- **URL:** https://nyaya-mitra-eb9a3.web.app
- **Lighthouse:** 13.4.1, headless Chrome
- **Date:** 15 September 2026

## Scores

| Category         | Desktop |  Mobile |
| :--------------- | ------: | ------: |
| Performance      | **100** | **100** |
| Accessibility    | **100** | **100** |
| Best practices   | **100** | **100** |
| SEO              | **100** | **100** |
| Agentic browsing | **100** | **100** |

## Metrics

| Metric                   | Desktop | Mobile |
| :----------------------- | ------: | -----: |
| First Contentful Paint   |   0.3 s |  1.3 s |
| Largest Contentful Paint |   0.3 s |  1.3 s |
| Speed Index              |   0.4 s |  1.6 s |
| Total Blocking Time      |    0 ms |   0 ms |
| Cumulative Layout Shift  |       0 |      0 |

Zero layout shift is a deliberate outcome, and it took a fix to keep — see below.

## Reproducing

```bash
npm run build -w @nyaya-mitra/client && firebase deploy --only hosting
```

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx lighthouse https://nyaya-mitra-eb9a3.web.app --preset=desktop --output=json --output-path=./lh.json
```

## What auditing caught

### Colour contrast, which unit tests cannot see

The visual design pass — a self-hosted typeface, a warmer palette, tinted
surfaces — dropped **accessibility from 100 to 96**. One element failed:
secondary text at **4.44:1** against the warm accent tint, just under the 4.5:1
minimum.

Every one of the 16 axe assertions in the test suite still passed, because jsdom
has no layout engine and no computed styles — it cannot measure contrast at all.
Only the deployed audit caught it.

The fix was to the design token rather than the one element: `--color-muted` was
darkened from `oklch(0.55 …)` to `oklch(0.51 …)`. A secondary-text token that
passes on white but fails on a tint is a trap that will be stepped on again, so
it now clears contrast on every surface in the system.

### Layout shift from an async catalogue

Adding the landing-page walkthrough regressed **cumulative layout shift to 0.187
on mobile**, dropping performance to 91. The example scenarios are fetched from
`/api/playbooks`, and the section rendered as nothing until they arrived — then
appeared and pushed the rest of the page down.

Fixed by reserving the grid: while the catalogue is loading, the section renders
placeholder cards sharing a `min-h` with the real ones, so the page occupies its
final height from first paint. CLS returned to **0**.

The distinction that made this possible is in the state model: the catalogue is
`null` while loading and `[]` when it loaded with nothing. Collapsing those two
into one empty array would have made "reserve space" and "render nothing"
indistinguishable.

### The first run

The initial audit scored **91 on SEO** and **67 on agentic browsing** — a missing
`robots.txt` and a missing `llms.txt`. Both were added, which is the point of
auditing a real deployment rather than asserting the site is fine.

### Caching the HTML entry point

An earlier check also found the HTML entry point was being served with
`max-age=3600` on the bare `/` path while `/index.html` was correctly `no-cache`.
After a redeploy, a returning visitor inside that hour would have received cached
HTML referencing asset hashes that no longer existed. Fixed by adding an explicit
header rule for `/`; hashed assets remain `immutable`.
