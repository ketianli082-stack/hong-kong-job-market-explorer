# Hong Kong Job Market Explorer

An English interactive dashboard reconstructed from the uploaded Tableau workbook data.

- Live preview: https://hong-kong-job-market-explorer.ketianli082.chatgpt.site
- Page 01 — Explore: market structure, industry distribution, gender and pay, risk and resilience
- Page 02 — Find Your Fit: priorities, multi-industry filtering, comparison and monthly budget

## Collaboration order

1. **叶同学 starts first** on branch `page1-ye` and implements the approved modification plan for Page 01.
2. **彭同学** works on Page 02 on branch `page2-peng` after the shared typography and colour baseline from Page 01 is confirmed or merged.
3. Each page is submitted to `main` through a pull request. Do not commit unfinished work directly to `main`.

The full Chinese modification plan is in [`docs/MODIFICATION_PLAN_ZH.md`](docs/MODIFICATION_PLAN_ZH.md).

## Page ownership

| Area | Owner | Primary files |
|---|---|---|
| Page 01 — Explore | 叶同学 | `index.html`, `app.js`, Page 01 rules in `styles.css` |
| Page 02 — Find Your Fit | 彭同学 | `fit.html`, `fit.js`, Page 02 rules in `styles.css` |
| Shared data and visual system | Coordinate before editing | `data/data.json`, shared rules in `styles.css` |

## Run locally

No build step is required. Serve the repository root with a local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Repository contents

- `index.html` / `app.js` — Page 01
- `fit.html` / `fit.js` — Page 02
- `styles.css` — shared visual system and responsive layout
- `data/data.json` — extracted workbook data used by both pages
- `assets/mark.svg` — site mark
- `docs/MODIFICATION_PLAN_ZH.md` — approved revision plan and acceptance criteria
- `downloads/hong-kong-job-market-explorer-source.zip` — downloadable source snapshot

The original `.twbx` file was not available in the current workspace at upload time. The extracted data used by the running site is included in `data/data.json`.
