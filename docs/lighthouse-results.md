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

Zero layout shift is a deliberate outcome: the app renders one stage at a time
into a fixed container rather than progressively revealing content.

## Reproducing

```bash
npm run build -w @nyaya-mitra/client && firebase deploy --only hosting
```

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx lighthouse https://nyaya-mitra-eb9a3.web.app --preset=desktop --output=json --output-path=./lh.json
```

## What the first run caught

The initial audit scored **91 on SEO** and **67 on agentic browsing** — a missing
`robots.txt` and a missing `llms.txt`. Both were added, which is the point of
auditing a real deployment rather than asserting the site is fine.

An earlier check also found the HTML entry point was being served with
`max-age=3600` on the bare `/` path while `/index.html` was correctly `no-cache`.
After a redeploy, a returning visitor inside that hour would have received cached
HTML referencing asset hashes that no longer existed. Fixed by adding an explicit
header rule for `/`; hashed assets remain `immutable`.
